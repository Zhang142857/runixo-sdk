<template>
  <div class="security-page">
    <div class="page-header">
      <div class="header-left">
        <el-button text @click="goBack"><el-icon><ArrowLeft /></el-icon></el-button>
        <span class="page-icon">🛡️</span>
        <div class="page-title">
          <h1>安全防护</h1>
          <span class="subtitle">{{ zoneName || '所有域名' }}</span>
        </div>
      </div>
      <div class="header-right">
        <el-button @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>刷新
        </el-button>
        <el-button type="danger" @click="toggleUnderAttack" :loading="toggling">
          {{ underAttackMode ? '关闭攻击模式' : '开启攻击模式' }}
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card danger">
        <div class="stat-icon"><el-icon><Warning /></el-icon></div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.blockedIPs }}</span>
          <span class="stat-label">已封禁IP</span>
        </div>
      </div>
      <div class="stat-card warning">
        <div class="stat-icon"><el-icon><View /></el-icon></div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.threats }}</span>
          <span class="stat-label">检测威胁</span>
        </div>
      </div>
      <div class="stat-card success">
        <div class="stat-icon"><el-icon><Check /></el-icon></div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.rules }}</span>
          <span class="stat-label">启用规则</span>
        </div>
      </div>
      <div class="stat-card info">
        <div class="stat-icon"><el-icon><Document /></el-icon></div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.logs }}</span>
          <span class="stat-label">监控日志</span>
        </div>
      </div>
    </div>

    <!-- 标签页 -->
    <el-tabs v-model="activeTab">
      <el-tab-pane label="封禁列表" name="blocked">
        <div class="tab-header">
          <el-input v-model="searchIP" placeholder="搜索IP..." style="width: 200px" clearable />
          <el-button type="primary" @click="showBlockDialog = true">手动封禁</el-button>
        </div>
        <el-table :data="filteredBlockedIPs" v-loading="loading">
          <el-table-column prop="ip" label="IP地址" width="150" />
          <el-table-column prop="zoneName" label="域名" width="180" />
          <el-table-column prop="reason" label="原因" />
          <el-table-column prop="threatType" label="威胁类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getThreatTagType(row.threatType)" size="small">
                {{ formatThreatType(row.threatType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="blockedAt" label="封禁时间" width="180">
            <template #default="{ row }">{{ formatTime(row.blockedAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button type="danger" size="small" @click="unblockIP(row)">解封</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="威胁检测" name="threats">
        <el-table :data="threats" v-loading="loading">
          <el-table-column prop="ip" label="IP地址" width="150" />
          <el-table-column prop="totalScore" label="威胁分数" width="100">
            <template #default="{ row }">
              <el-tag :type="row.totalScore >= 100 ? 'danger' : row.totalScore >= 50 ? 'warning' : 'info'">
                {{ row.totalScore }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="威胁类型">
            <template #default="{ row }">
              <el-tag v-for="(count, type) in row.threatCounts" :key="type" size="small" style="margin: 2px">
                {{ formatThreatType(type) }}: {{ count }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="lastSeen" label="最后活动" width="180">
            <template #default="{ row }">{{ formatTime(row.lastSeen) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button type="warning" size="small" @click="blockThreat(row)">封禁</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="安全规则" name="rules">
        <div class="tab-header">
          <el-button type="primary" @click="showRuleDialog = true">添加规则</el-button>
        </div>
        <el-table :data="rules" v-loading="loading">
          <el-table-column prop="name" label="规则名称" />
          <el-table-column prop="type" label="类型" width="120" />
          <el-table-column prop="enabled" label="状态" width="100">
            <template #default="{ row }">
              <el-switch v-model="row.enabled" @change="toggleRule(row)" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button type="danger" size="small" text @click="deleteRule(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="访问规则" name="access">
        <el-table :data="accessRules" v-loading="loading">
          <el-table-column prop="configuration.value" label="IP/范围" width="180" />
          <el-table-column prop="mode" label="动作" width="120">
            <template #default="{ row }">
              <el-tag :type="row.mode === 'block' ? 'danger' : row.mode === 'whitelist' ? 'success' : 'warning'">
                {{ row.mode }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="notes" label="备注" />
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button type="danger" size="small" text @click="deleteAccessRule(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 手动封禁对话框 -->
    <el-dialog v-model="showBlockDialog" title="手动封禁IP" width="450px">
      <el-form :model="blockForm" label-width="80px">
        <el-form-item label="IP地址" required>
          <el-input v-model="blockForm.ip" placeholder="输入要封禁的IP" />
        </el-form-item>
        <el-form-item label="域名">
          <el-select v-model="blockForm.zoneId" placeholder="选择域名" style="width: 100%">
            <el-option v-for="zone in zones" :key="zone.id" :label="zone.name" :value="zone.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="原因">
          <el-input v-model="blockForm.reason" placeholder="封禁原因" />
        </el-form-item>
        <el-form-item label="时长">
          <el-select v-model="blockForm.duration" style="width: 100%">
            <el-option label="1小时" :value="3600" />
            <el-option label="24小时" :value="86400" />
            <el-option label="7天" :value="604800" />
            <el-option label="永久" :value="0" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBlockDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmBlock" :loading="blocking">封禁</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Refresh, Warning, View, Check, Document } from '@element-plus/icons-vue'

interface BlockedIP {
  ip: string
  ruleId: string
  zoneId: string
  zoneName: string
  reason: string
  threatType: string
  blockedAt: string
}

interface Threat {
  ip: string
  totalScore: number
  threatCounts: Record<string, number>
  lastSeen: string
}

interface Zone {
  id: string
  name: string
}

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const toggling = ref(false)
const blocking = ref(false)
const activeTab = ref('blocked')
const searchIP = ref('')
const showBlockDialog = ref(false)
const showRuleDialog = ref(false)
const underAttackMode = ref(false)

const zoneId = ref(route.params.zoneId as string || '')
const zoneName = ref('')
const zones = ref<Zone[]>([])
const blockedIPs = ref<BlockedIP[]>([])
const threats = ref<Threat[]>([])
const rules = ref<any[]>([])
const accessRules = ref<any[]>([])

const stats = ref({
  blockedIPs: 0,
  threats: 0,
  rules: 0,
  logs: 0
})

const blockForm = ref({
  ip: '',
  zoneId: '',
  reason: '',
  duration: 3600
})

const filteredBlockedIPs = computed(() => {
  if (!searchIP.value) return blockedIPs.value
  return blockedIPs.value.filter(b => b.ip.includes(searchIP.value))
})

function goBack() {
  router.push('/plugin/cloudflare')
}

async function refreshData() {
  loading.value = true
  try {
    await Promise.all([loadZones(), loadBlockedIPs(), loadThreats(), loadRules(), loadAccessRules()])
    updateStats()
  } finally {
    loading.value = false
  }
}

async function loadZones() {
  try {
    const response = await window.electronAPI.http.request({
      url: 'https://api.cloudflare.com/client/v4/zones',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${await getApiToken()}`, 'Content-Type': 'application/json' }
    })
    if (response.success && response.data?.success) {
      zones.value = response.data.result || []
      if (zoneId.value) {
        const zone = zones.value.find(z => z.id === zoneId.value)
        if (zone) zoneName.value = zone.name
      }
    }
  } catch (e) { console.error('Load zones failed:', e) }
}

async function loadBlockedIPs() {
  // 从本地存储或Agent获取封禁列表
  blockedIPs.value = []
}

async function loadThreats() {
  // 从Agent获取威胁列表
  threats.value = []
}

async function loadRules() {
  // 从本地存储获取规则
  rules.value = []
}

async function loadAccessRules() {
  if (!zoneId.value || zones.value.length === 0) return
  const targetZone = zoneId.value || zones.value[0]?.id
  if (!targetZone) return

  try {
    const response = await window.electronAPI.http.request({
      url: `https://api.cloudflare.com/client/v4/zones/${targetZone}/firewall/access_rules/rules`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${await getApiToken()}`, 'Content-Type': 'application/json' }
    })
    if (response.success && response.data?.success) {
      accessRules.value = response.data.result || []
    }
  } catch (e) { console.error('Load access rules failed:', e) }
}

function updateStats() {
  stats.value = {
    blockedIPs: blockedIPs.value.length + accessRules.value.filter(r => r.mode === 'block').length,
    threats: threats.value.length,
    rules: rules.value.filter(r => r.enabled).length,
    logs: 0
  }
}

async function getApiToken(): Promise<string> {
  const result = await window.electronAPI.secure.getCredential('cloudflare:apiToken')
  return result.value || ''
}

async function toggleUnderAttack() {
  if (!zoneId.value && zones.value.length === 0) {
    ElMessage.warning('请先选择域名')
    return
  }
  const targetZone = zoneId.value || zones.value[0]?.id
  toggling.value = true
  try {
    const level = underAttackMode.value ? 'medium' : 'under_attack'
    const response = await window.electronAPI.http.request({
      url: `https://api.cloudflare.com/client/v4/zones/${targetZone}/settings/security_level`,
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${await getApiToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: level })
    })
    if (response.success && response.data?.success) {
      underAttackMode.value = !underAttackMode.value
      ElMessage.success(underAttackMode.value ? '已开启攻击模式' : '已关闭攻击模式')
    }
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    toggling.value = false
  }
}

async function confirmBlock() {
  if (!blockForm.value.ip) {
    ElMessage.warning('请输入IP地址')
    return
  }
  if (!blockForm.value.zoneId && zones.value.length > 0) {
    blockForm.value.zoneId = zones.value[0].id
  }
  blocking.value = true
  try {
    const response = await window.electronAPI.http.request({
      url: `https://api.cloudflare.com/client/v4/zones/${blockForm.value.zoneId}/firewall/access_rules/rules`,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${await getApiToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'block',
        configuration: { target: 'ip', value: blockForm.value.ip },
        notes: blockForm.value.reason || 'Blocked by Runixo'
      })
    })
    if (response.success && response.data?.success) {
      ElMessage.success('IP已封禁')
      showBlockDialog.value = false
      blockForm.value = { ip: '', zoneId: '', reason: '', duration: 3600 }
      await loadAccessRules()
      updateStats()
    } else {
      throw new Error(response.data?.errors?.[0]?.message || 'Failed')
    }
  } catch (e) {
    ElMessage.error('封禁失败: ' + (e as Error).message)
  } finally {
    blocking.value = false
  }
}

async function unblockIP(row: BlockedIP) {
  await ElMessageBox.confirm(`确定要解封 ${row.ip} 吗？`, '确认')
  try {
    const response = await window.electronAPI.http.request({
      url: `https://api.cloudflare.com/client/v4/zones/${row.zoneId}/firewall/access_rules/rules/${row.ruleId}`,
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${await getApiToken()}`, 'Content-Type': 'application/json' }
    })
    if (response.success) {
      ElMessage.success('已解封')
      await loadBlockedIPs()
      updateStats()
    }
  } catch (e) {
    ElMessage.error('解封失败')
  }
}

async function blockThreat(row: Threat) {
  blockForm.value.ip = row.ip
  blockForm.value.reason = `Auto-detected threat (score: ${row.totalScore})`
  showBlockDialog.value = true
}

async function toggleRule(row: any) {
  ElMessage.success(row.enabled ? '规则已启用' : '规则已禁用')
}

async function deleteRule(row: any) {
  await ElMessageBox.confirm('确定要删除此规则吗？', '确认')
  rules.value = rules.value.filter(r => r.id !== row.id)
  ElMessage.success('规则已删除')
}

async function deleteAccessRule(row: any) {
  await ElMessageBox.confirm(`确定要删除此访问规则吗？`, '确认')
  const targetZone = zoneId.value || zones.value[0]?.id
  try {
    await window.electronAPI.http.request({
      url: `https://api.cloudflare.com/client/v4/zones/${targetZone}/firewall/access_rules/rules/${row.id}`,
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${await getApiToken()}`, 'Content-Type': 'application/json' }
    })
    ElMessage.success('已删除')
    await loadAccessRules()
    updateStats()
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

function formatTime(time: string) {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

function formatThreatType(type: string) {
  const map: Record<string, string> = {
    brute_force: '暴力破解',
    scanning: '扫描探测',
    sql_injection: 'SQL注入',
    xss: 'XSS攻击',
    path_traversal: '路径遍历',
    bot_abuse: '恶意爬虫',
    ddos: 'DDoS',
    unknown: '未知'
  }
  return map[type] || type
}

function getThreatTagType(type: string) {
  const map: Record<string, string> = {
    brute_force: 'danger',
    sql_injection: 'danger',
    xss: 'danger',
    scanning: 'warning',
    bot_abuse: 'warning',
    ddos: 'danger'
  }
  return map[type] || 'info'
}

onMounted(() => {
  refreshData()
})
</script>

<style lang="scss" scoped>
.security-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .page-icon { font-size: 32px; }
    .page-title {
      h1 { font-size: 20px; font-weight: 600; margin: 0; }
      .subtitle { font-size: 13px; color: var(--text-secondary); }
    }
  }

  .header-right { display: flex; gap: 8px; }
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  .stat-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: var(--bg-secondary);
    border-radius: 12px;

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }

    &.danger .stat-icon { background: rgba(245, 108, 108, 0.1); color: #f56c6c; }
    &.warning .stat-icon { background: rgba(230, 162, 60, 0.1); color: #e6a23c; }
    &.success .stat-icon { background: rgba(103, 194, 58, 0.1); color: #67c23a; }
    &.info .stat-icon { background: rgba(64, 158, 255, 0.1); color: #409eff; }

    .stat-info {
      display: flex;
      flex-direction: column;
      .stat-value { font-size: 24px; font-weight: 600; }
      .stat-label { font-size: 13px; color: var(--text-secondary); }
    }
  }
}

.tab-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}
</style>
