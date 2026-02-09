<template>
  <div class="cloudflare-page">
    <div class="page-header">
      <div class="header-left">
        <span class="provider-icon">☁️</span>
        <div>
          <h1>Cloudflare</h1>
          <p class="subtitle">DNS、CDN、SSL 和 Tunnel 管理</p>
        </div>
      </div>
      <div class="header-right">
        <el-button @click="showSettings" :type="isAuthenticated ? '' : 'warning'">
          <el-icon><Setting /></el-icon>
          {{ isAuthenticated ? '设置' : '配置 API' }}
        </el-button>
        <el-select v-model="selectedZone" placeholder="选择域名" @change="loadZoneData" :disabled="!isAuthenticated" style="width: 200px">
          <el-option v-for="zone in zones" :key="zone.id" :label="zone.name" :value="zone.id" />
        </el-select>
        <el-button @click="refreshData" :loading="loading" :disabled="!isAuthenticated">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 未配置 API 提示 -->
    <el-alert
      v-if="!isAuthenticated"
      title="请先配置 Cloudflare API"
      type="warning"
      show-icon
      :closable="false"
      class="api-alert"
    >
      <template #default>
        点击右上角"配置 API"按钮，输入您的 Cloudflare API 令牌以开始使用。
        <el-link type="primary" href="https://dash.cloudflare.com/profile/api-tokens" target="_blank">
          获取 API 令牌
        </el-link>
      </template>
    </el-alert>

    <!-- 主要内容 -->
    <div v-else>
      <!-- 统计卡片 -->
      <div class="stats-row">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon zones">
              <el-icon><Globe /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ zones.length }}</div>
              <div class="stat-label">域名总数</div>
            </div>
          </div>
        </el-card>

        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon records">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ dnsRecords.length }}</div>
              <div class="stat-label">DNS 记录</div>
            </div>
          </div>
        </el-card>

        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon status">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ activeZones }}</div>
              <div class="stat-label">活跃域名</div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 域名列表 -->
      <el-card v-if="!selectedZone" class="zones-card">
        <template #header>
          <span>域名列表</span>
        </template>
        <el-table :data="zones" v-loading="loading" stripe>
          <el-table-column prop="name" label="域名" min-width="200" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'warning'" size="small">
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="plan.name" label="套餐" width="120" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button text size="small" @click="selectZone(row.id)">
                管理
              </el-button>
              <el-button text size="small" @click="viewDNS(row.id)">
                DNS
              </el-button>
              <el-button text size="small" @click="purgeCacheForZone(row.id)">
                清除缓存
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- DNS 记录管理 -->
      <el-card v-else class="dns-card">
        <template #header>
          <div class="card-header">
            <span>DNS 记录</span>
            <div>
              <el-button type="primary" size="small" @click="showAddDNSDialog">
                <el-icon><Plus /></el-icon>
                添加记录
              </el-button>
              <el-button size="small" @click="selectedZone = null">
                返回
              </el-button>
            </div>
          </div>
        </template>

        <el-input
          v-model="dnsSearch"
          placeholder="搜索记录..."
          clearable
          style="margin-bottom: 16px; width: 300px"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-table :data="filteredDNSRecords" v-loading="loading" stripe>
          <el-table-column prop="type" label="类型" width="80">
            <template #default="{ row }">
              <el-tag size="small">{{ row.type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="名称" min-width="200" show-overflow-tooltip />
          <el-table-column prop="content" label="内容" min-width="200" show-overflow-tooltip />
          <el-table-column prop="ttl" label="TTL" width="100">
            <template #default="{ row }">
              {{ row.ttl === 1 ? '自动' : row.ttl + 's' }}
            </template>
          </el-table-column>
          <el-table-column label="代理" width="80">
            <template #default="{ row }">
              <el-tag :type="row.proxied ? 'success' : 'info'" size="small">
                {{ row.proxied ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button text size="small" type="danger" @click="deleteDNS(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 添加 DNS 记录对话框 -->
    <el-dialog v-model="showDNSDialog" title="添加 DNS 记录" width="500px">
      <el-form :model="dnsForm" label-width="100px">
        <el-form-item label="记录类型">
          <el-select v-model="dnsForm.type" placeholder="选择类型">
            <el-option label="A" value="A" />
            <el-option label="AAAA" value="AAAA" />
            <el-option label="CNAME" value="CNAME" />
            <el-option label="TXT" value="TXT" />
            <el-option label="MX" value="MX" />
          </el-select>
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="dnsForm.name" placeholder="例如: www" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="dnsForm.content" placeholder="例如: 192.168.1.1" />
        </el-form-item>
        <el-form-item label="代理">
          <el-switch v-model="dnsForm.proxied" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDNSDialog = false">取消</el-button>
        <el-button type="primary" @click="addDNSRecord" :loading="submitting">
          添加
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Setting,
  Refresh,
  Globe,
  Document,
  CircleCheck,
  Plus,
  Search
} from '@element-plus/icons-vue'

const isAuthenticated = ref(false)
const loading = ref(false)
const submitting = ref(false)
const zones = ref<any[]>([])
const selectedZone = ref<string | null>(null)
const dnsRecords = ref<any[]>([])
const dnsSearch = ref('')
const showDNSDialog = ref(false)
const dnsForm = ref({
  type: 'A',
  name: '',
  content: '',
  proxied: false
})

const activeZones = computed(() => {
  return zones.value.filter(z => z.status === 'active').length
})

const filteredDNSRecords = computed(() => {
  if (!dnsSearch.value) return dnsRecords.value
  const query = dnsSearch.value.toLowerCase()
  return dnsRecords.value.filter(record =>
    record.name.toLowerCase().includes(query) ||
    record.content.toLowerCase().includes(query) ||
    record.type.toLowerCase().includes(query)
  )
})

onMounted(async () => {
  await checkAuthentication()
  if (isAuthenticated.value) {
    await loadZones()
  }
})

async function checkAuthentication() {
  try {
    const result = await window.electronAPI.plugin.call('cloudflare', 'isAuthenticated')
    isAuthenticated.value = result
  } catch (error) {
    console.error('Failed to check authentication:', error)
  }
}

async function loadZones() {
  loading.value = true
  try {
    zones.value = await window.electronAPI.plugin.call('cloudflare', 'getZones')
  } catch (error: any) {
    ElMessage.error('加载域名失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

async function loadZoneData() {
  if (!selectedZone.value) return
  await loadDNSRecords()
}

async function loadDNSRecords() {
  if (!selectedZone.value) return
  
  loading.value = true
  try {
    dnsRecords.value = await window.electronAPI.plugin.call(
      'cloudflare',
      'getDNSRecords',
      selectedZone.value
    )
  } catch (error: any) {
    ElMessage.error('加载 DNS 记录失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

async function refreshData() {
  if (selectedZone.value) {
    await loadDNSRecords()
  } else {
    await loadZones()
  }
}

function selectZone(zoneId: string) {
  selectedZone.value = zoneId
  loadZoneData()
}

function viewDNS(zoneId: string) {
  selectZone(zoneId)
}

function showSettings() {
  ElMessage.info('请在设置 > 插件 > Cloudflare 中配置')
}

function showAddDNSDialog() {
  dnsForm.value = {
    type: 'A',
    name: '',
    content: '',
    proxied: false
  }
  showDNSDialog.value = true
}

async function addDNSRecord() {
  if (!selectedZone.value) return
  
  if (!dnsForm.value.name || !dnsForm.value.content) {
    ElMessage.warning('请填写完整信息')
    return
  }

  submitting.value = true
  try {
    await window.electronAPI.plugin.call('cloudflare', 'createDNSRecord', {
      zoneId: selectedZone.value,
      ...dnsForm.value
    })
    
    showDNSDialog.value = false
    await loadDNSRecords()
  } catch (error: any) {
    ElMessage.error('添加失败: ' + error.message)
  } finally {
    submitting.value = false
  }
}

async function deleteDNS(record: any) {
  try {
    await ElMessageBox.confirm(`确定要删除 DNS 记录 "${record.name}" 吗？`, '确认删除', {
      type: 'warning'
    })

    await window.electronAPI.plugin.call('cloudflare', 'deleteDNSRecord', {
      zoneId: selectedZone.value,
      recordId: record.id
    })

    await loadDNSRecords()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + error.message)
    }
  }
}

async function purgeCacheForZone(zoneId: string) {
  try {
    await ElMessageBox.confirm('确定要清除该域名的所有缓存吗？', '确认', {
      type: 'warning'
    })

    await window.electronAPI.plugin.call('cloudflare', 'purgeCache', {
      zoneId,
      purgeEverything: true
    })
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('清除缓存失败: ' + error.message)
    }
  }
}
</script>

<style scoped>
.cloudflare-page {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.provider-icon {
  font-size: 48px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  margin: 0;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 14px;
  margin: 4px 0 0 0;
}

.header-right {
  display: flex;
  gap: 12px;
}

.api-alert {
  margin-bottom: 24px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.stat-icon.zones {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-icon.records {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.stat-icon.status {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
