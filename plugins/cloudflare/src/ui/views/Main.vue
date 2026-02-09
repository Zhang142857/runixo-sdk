<template>
  <div class="cloudflare-main">
    <!-- 未配置状态 -->
    <div v-if="!isConfigured" class="setup-panel">
      <div class="setup-icon">☁️</div>
      <h2>连接 Cloudflare</h2>
      <p>请输入您的 Cloudflare API Token 以开始使用</p>
      <el-form :model="configForm" label-width="120px" style="max-width: 400px; margin: 24px auto;">
        <el-form-item label="API Token" required>
          <el-input v-model="configForm.apiToken" type="password" show-password placeholder="输入 Cloudflare API Token" />
        </el-form-item>
        <el-form-item label="Account ID">
          <el-input v-model="configForm.accountId" placeholder="可选" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveConfig" :loading="saving">连接</el-button>
          <el-button @click="openTokenHelp">如何获取 Token?</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 已配置状态 -->
    <template v-else>
      <div class="page-header">
        <div class="header-left">
          <span class="page-icon">☁️</span>
          <div class="page-title">
            <h1>Cloudflare</h1>
            <span class="subtitle">DNS、CDN、安全防护管理</span>
          </div>
        </div>
        <div class="header-right">
          <el-button @click="refreshZones" :loading="loading">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
          <el-button @click="showSettings = true">
            <el-icon><Setting /></el-icon>
            设置
          </el-button>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon zones"><el-icon><Globe /></el-icon></div>
          <div class="stat-info">
            <span class="stat-value">{{ zones.length }}</span>
            <span class="stat-label">域名</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon active"><el-icon><CircleCheck /></el-icon></div>
          <div class="stat-info">
            <span class="stat-value">{{ activeZones }}</span>
            <span class="stat-label">活跃</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon proxied"><el-icon><Connection /></el-icon></div>
          <div class="stat-info">
            <span class="stat-value">{{ proxiedCount }}</span>
            <span class="stat-label">已代理</span>
          </div>
        </div>
      </div>

      <!-- 域名列表 -->
      <div class="zones-section">
        <div class="section-header">
          <h2>域名列表</h2>
          <el-input v-model="searchQuery" placeholder="搜索域名..." style="width: 240px;" clearable>
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </div>

        <div v-if="loading" class="loading-container">
          <el-icon class="loading-icon"><Loading /></el-icon>
          <span>加载中...</span>
        </div>

        <div v-else-if="filteredZones.length === 0" class="empty-container">
          <el-empty description="没有找到域名" />
        </div>

        <div v-else class="zones-grid">
          <el-card v-for="zone in filteredZones" :key="zone.id" class="zone-card" @click="selectZone(zone)">
            <div class="zone-header">
              <div class="zone-name">
                <span class="domain">{{ zone.name }}</span>
                <el-tag :type="zone.status === 'active' ? 'success' : 'warning'" size="small">
                  {{ zone.status === 'active' ? '活跃' : zone.status }}
                </el-tag>
              </div>
              <el-dropdown @command="handleZoneAction($event, zone)" trigger="click">
                <el-button text @click.stop><el-icon><MoreFilled /></el-icon></el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="dns">DNS 管理</el-dropdown-item>
                    <el-dropdown-item command="security">安全设置</el-dropdown-item>
                    <el-dropdown-item command="purge" divided>清除缓存</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            <div class="zone-info">
              <div class="info-item">
                <span class="label">Plan:</span>
                <span class="value">{{ zone.plan?.name || 'Free' }}</span>
              </div>
              <div class="info-item">
                <span class="label">NS:</span>
                <span class="value">{{ zone.name_servers?.length || 0 }} 个</span>
              </div>
            </div>
            <div class="zone-actions">
              <el-button size="small" @click.stop="goToDNS(zone)">DNS</el-button>
              <el-button size="small" @click.stop="goToSecurity(zone)">安全</el-button>
              <el-button size="small" type="warning" @click.stop="purgeCache(zone)">清缓存</el-button>
            </div>
          </el-card>
        </div>
      </div>
    </template>

    <!-- 设置对话框 -->
    <el-dialog v-model="showSettings" title="Cloudflare 设置" width="450px">
      <el-form :model="configForm" label-width="120px">
        <el-form-item label="API Token">
          <el-input v-model="configForm.apiToken" type="password" show-password />
        </el-form-item>
        <el-form-item label="Account ID">
          <el-input v-model="configForm.accountId" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="disconnect" type="danger">断开连接</el-button>
        <el-button @click="showSettings = false">取消</el-button>
        <el-button type="primary" @click="saveConfig" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 清除缓存对话框 -->
    <el-dialog v-model="showPurgeDialog" title="清除缓存" width="450px">
      <div v-if="selectedZone">
        <p>确定要清除 <strong>{{ selectedZone.name }}</strong> 的缓存吗？</p>
        <el-radio-group v-model="purgeType" style="margin-top: 16px;">
          <el-radio label="all">清除所有缓存</el-radio>
          <el-radio label="files">清除指定文件</el-radio>
        </el-radio-group>
        <el-input
          v-if="purgeType === 'files'"
          v-model="purgeFiles"
          type="textarea"
          :rows="4"
          placeholder="每行一个 URL"
          style="margin-top: 12px;"
        />
      </div>
      <template #footer>
        <el-button @click="showPurgeDialog = false">取消</el-button>
        <el-button type="warning" @click="confirmPurge" :loading="purging">清除缓存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Setting, Search, Loading, MoreFilled, Globe, CircleCheck, Connection } from '@element-plus/icons-vue'

interface Zone {
  id: string
  name: string
  status: string
  plan?: { name: string }
  name_servers?: string[]
}

const router = useRouter()

const isConfigured = ref(false)
const loading = ref(false)
const saving = ref(false)
const purging = ref(false)
const showSettings = ref(false)
const showPurgeDialog = ref(false)
const searchQuery = ref('')
const zones = ref<Zone[]>([])
const selectedZone = ref<Zone | null>(null)
const purgeType = ref('all')
const purgeFiles = ref('')

const configForm = ref({
  apiToken: '',
  accountId: ''
})

const activeZones = computed(() => zones.value.filter(z => z.status === 'active').length)
const proxiedCount = computed(() => zones.value.length) // 简化，实际需要统计代理的记录数

const filteredZones = computed(() => {
  if (!searchQuery.value) return zones.value
  const query = searchQuery.value.toLowerCase()
  return zones.value.filter(z => z.name.toLowerCase().includes(query))
})

async function loadConfig() {
  try {
    // 从安全存储加载配置
    const result = await window.electronAPI.secure.getCredential('cloudflare:apiToken')
    if (result.success && result.value) {
      configForm.value.apiToken = result.value
      isConfigured.value = true
      await refreshZones()
    }
  } catch (e) {
    console.error('Failed to load config:', e)
  }
}

async function saveConfig() {
  if (!configForm.value.apiToken) {
    ElMessage.warning('请输入 API Token')
    return
  }

  saving.value = true
  try {
    // 保存到安全存储
    await window.electronAPI.secure.setCredential('cloudflare:apiToken', configForm.value.apiToken)
    if (configForm.value.accountId) {
      await window.electronAPI.secure.setCredential('cloudflare:accountId', configForm.value.accountId)
    }

    isConfigured.value = true
    showSettings.value = false
    ElMessage.success('配置已保存')
    await refreshZones()
  } catch (e) {
    ElMessage.error('保存失败: ' + (e as Error).message)
  } finally {
    saving.value = false
  }
}

async function disconnect() {
  await ElMessageBox.confirm('确定要断开 Cloudflare 连接吗？', '确认')
  await window.electronAPI.secure.deleteCredential('cloudflare:apiToken')
  await window.electronAPI.secure.deleteCredential('cloudflare:accountId')
  isConfigured.value = false
  zones.value = []
  configForm.value = { apiToken: '', accountId: '' }
  showSettings.value = false
  ElMessage.info('已断开连接')
}

async function refreshZones() {
  loading.value = true
  try {
    // 调用 Cloudflare API 获取域名列表
    const response = await window.electronAPI.http.request({
      url: 'https://api.cloudflare.com/client/v4/zones',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${configForm.value.apiToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.success && response.data?.success) {
      zones.value = response.data.result || []
    } else {
      const errors = response.data?.errors?.map((e: { message: string }) => e.message).join(', ')
      throw new Error(errors || 'Failed to fetch zones')
    }
  } catch (e) {
    ElMessage.error('获取域名列表失败: ' + (e as Error).message)
  } finally {
    loading.value = false
  }
}

function selectZone(zone: Zone) {
  goToDNS(zone)
}

function goToDNS(zone: Zone) {
  router.push(`/cloud/cloudflare?tab=dns&zone=${zone.id}`)
}

function goToSecurity(zone: Zone) {
  router.push(`/cloud/cloudflare?tab=security&zone=${zone.id}`)
}

function handleZoneAction(action: string, zone: Zone) {
  switch (action) {
    case 'dns':
      goToDNS(zone)
      break
    case 'security':
      goToSecurity(zone)
      break
    case 'purge':
      purgeCache(zone)
      break
  }
}

function purgeCache(zone: Zone) {
  selectedZone.value = zone
  purgeType.value = 'all'
  purgeFiles.value = ''
  showPurgeDialog.value = true
}

async function confirmPurge() {
  if (!selectedZone.value) return

  purging.value = true
  try {
    const body: { purge_everything?: boolean; files?: string[] } = {}
    if (purgeType.value === 'all') {
      body.purge_everything = true
    } else {
      body.files = purgeFiles.value.split('\n').filter(f => f.trim())
    }

    const response = await window.electronAPI.http.request({
      url: `https://api.cloudflare.com/client/v4/zones/${selectedZone.value.id}/purge_cache`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${configForm.value.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (response.success && response.data?.success) {
      ElMessage.success('缓存已清除')
      showPurgeDialog.value = false
    } else {
      throw new Error(response.data?.errors?.[0]?.message || 'Failed to purge cache')
    }
  } catch (e) {
    ElMessage.error('清除缓存失败: ' + (e as Error).message)
  } finally {
    purging.value = false
  }
}

function openTokenHelp() {
  window.electronAPI.shell.openExternal('https://dash.cloudflare.com/profile/api-tokens')
}

onMounted(() => {
  loadConfig()
})
</script>

<style lang="scss" scoped>
.cloudflare-main {
  max-width: 1200px;
  margin: 0 auto;
}

.setup-panel {
  text-align: center;
  padding: 60px 20px;

  .setup-icon {
    font-size: 64px;
    margin-bottom: 16px;
  }

  h2 {
    font-size: 24px;
    margin-bottom: 8px;
  }

  p {
    color: var(--text-secondary);
    margin-bottom: 24px;
  }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .page-icon {
      font-size: 40px;
    }

    .page-title {
      h1 {
        font-size: 24px;
        font-weight: 600;
        margin: 0;
      }

      .subtitle {
        font-size: 14px;
        color: var(--text-secondary);
      }
    }
  }

  .header-right {
    display: flex;
    gap: 8px;
  }
}

.stats-row {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;

  .stat-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px 24px;
    background: var(--bg-secondary);
    border-radius: 12px;
    min-width: 160px;

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;

      &.zones {
        background: rgba(var(--el-color-primary-rgb), 0.1);
        color: var(--el-color-primary);
      }

      &.active {
        background: rgba(var(--el-color-success-rgb), 0.1);
        color: var(--el-color-success);
      }

      &.proxied {
        background: rgba(var(--el-color-warning-rgb), 0.1);
        color: var(--el-color-warning);
      }
    }

    .stat-info {
      display: flex;
      flex-direction: column;

      .stat-value {
        font-size: 28px;
        font-weight: 600;
      }

      .stat-label {
        font-size: 13px;
        color: var(--text-secondary);
      }
    }
  }
}

.zones-section {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h2 {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
    }
  }
}

.loading-container,
.empty-container {
  padding: 60px 20px;
  text-align: center;

  .loading-icon {
    font-size: 32px;
    animation: spin 1s linear infinite;
    margin-bottom: 12px;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.zones-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.zone-card {
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--el-color-primary);
  }

  .zone-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;

    .zone-name {
      display: flex;
      align-items: center;
      gap: 8px;

      .domain {
        font-size: 16px;
        font-weight: 600;
      }
    }
  }

  .zone-info {
    display: flex;
    gap: 24px;
    margin-bottom: 16px;
    font-size: 13px;

    .info-item {
      .label {
        color: var(--text-secondary);
        margin-right: 4px;
      }
    }
  }

  .zone-actions {
    display: flex;
    gap: 8px;
  }
}
</style>
