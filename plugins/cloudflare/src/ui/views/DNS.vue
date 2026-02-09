<template>
  <div class="dns-page">
    <div class="page-header">
      <div class="header-left">
        <el-button text @click="goBack"><el-icon><ArrowLeft /></el-icon></el-button>
        <span class="page-icon">🌐</span>
        <div class="page-title">
          <h1>DNS 管理</h1>
          <span class="subtitle">{{ zoneName || '选择域名' }}</span>
        </div>
      </div>
      <div class="header-right">
        <el-select v-model="selectedZone" placeholder="选择域名" style="width: 200px" @change="loadRecords">
          <el-option v-for="zone in zones" :key="zone.id" :label="zone.name" :value="zone.id" />
        </el-select>
        <el-button @click="loadRecords" :loading="loading"><el-icon><Refresh /></el-icon>刷新</el-button>
        <el-button type="primary" @click="showAddDialog = true">添加记录</el-button>
      </div>
    </div>

    <!-- 记录类型过滤 -->
    <div class="filter-bar">
      <el-radio-group v-model="filterType" @change="filterRecords">
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button label="A">A</el-radio-button>
        <el-radio-button label="AAAA">AAAA</el-radio-button>
        <el-radio-button label="CNAME">CNAME</el-radio-button>
        <el-radio-button label="MX">MX</el-radio-button>
        <el-radio-button label="TXT">TXT</el-radio-button>
        <el-radio-button label="NS">NS</el-radio-button>
      </el-radio-group>
      <el-input v-model="searchQuery" placeholder="搜索记录..." style="width: 200px" clearable />
    </div>

    <!-- DNS 记录表格 -->
    <el-table :data="filteredRecords" v-loading="loading" style="width: 100%">
      <el-table-column prop="type" label="类型" width="80">
        <template #default="{ row }">
          <el-tag :type="getTypeTagColor(row.type)" size="small">{{ row.type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="名称" min-width="200">
        <template #default="{ row }">
          <span class="record-name">{{ formatName(row.name) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="content" label="内容" min-width="250">
        <template #default="{ row }">
          <span class="record-content">{{ row.content }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="proxied" label="代理" width="80">
        <template #default="{ row }">
          <el-switch v-model="row.proxied" :disabled="!canProxy(row.type)" @change="updateProxy(row)" size="small" />
        </template>
      </el-table-column>
      <el-table-column prop="ttl" label="TTL" width="100">
        <template #default="{ row }">{{ row.ttl === 1 ? '自动' : row.ttl + 's' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button type="primary" size="small" text @click="editRecord(row)">编辑</el-button>
          <el-button type="danger" size="small" text @click="deleteRecord(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加/编辑记录对话框 -->
    <el-dialog v-model="showAddDialog" :title="editingRecord ? '编辑记录' : '添加记录'" width="500px">
      <el-form :model="recordForm" label-width="80px">
        <el-form-item label="类型" required>
          <el-select v-model="recordForm.type" style="width: 100%" :disabled="!!editingRecord">
            <el-option label="A - IPv4地址" value="A" />
            <el-option label="AAAA - IPv6地址" value="AAAA" />
            <el-option label="CNAME - 别名" value="CNAME" />
            <el-option label="MX - 邮件服务器" value="MX" />
            <el-option label="TXT - 文本记录" value="TXT" />
            <el-option label="NS - 名称服务器" value="NS" />
            <el-option label="SRV - 服务记录" value="SRV" />
          </el-select>
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="recordForm.name" placeholder="@ 或子域名">
            <template #append>.{{ zoneName }}</template>
          </el-input>
        </el-form-item>
        <el-form-item label="内容" required>
          <el-input v-model="recordForm.content" :placeholder="getContentPlaceholder()" />
        </el-form-item>
        <el-form-item label="代理" v-if="canProxy(recordForm.type)">
          <el-switch v-model="recordForm.proxied" />
          <span class="form-hint">启用 Cloudflare 代理</span>
        </el-form-item>
        <el-form-item label="TTL">
          <el-select v-model="recordForm.ttl" style="width: 100%">
            <el-option label="自动" :value="1" />
            <el-option label="1分钟" :value="60" />
            <el-option label="5分钟" :value="300" />
            <el-option label="1小时" :value="3600" />
            <el-option label="1天" :value="86400" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="saveRecord" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Refresh } from '@element-plus/icons-vue'

interface DNSRecord {
  id: string
  type: string
  name: string
  content: string
  proxied: boolean
  ttl: number
  zone_id: string
}

interface Zone {
  id: string
  name: string
}

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const showAddDialog = ref(false)
const editingRecord = ref<DNSRecord | null>(null)
const selectedZone = ref('')
const zoneName = ref('')
const filterType = ref('')
const searchQuery = ref('')

const zones = ref<Zone[]>([])
const records = ref<DNSRecord[]>([])

const recordForm = ref({
  type: 'A',
  name: '',
  content: '',
  proxied: false,
  ttl: 1
})

const filteredRecords = computed(() => {
  let result = records.value
  if (filterType.value) {
    result = result.filter(r => r.type === filterType.value)
  }
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(r =>
      r.name.toLowerCase().includes(query) ||
      r.content.toLowerCase().includes(query)
    )
  }
  return result
})

function goBack() {
  router.push('/plugin/cloudflare')
}

async function getApiToken(): Promise<string> {
  const result = await window.electronAPI.secure.getCredential('cloudflare:apiToken')
  return result.value || ''
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
      if (route.params.zoneId) {
        selectedZone.value = route.params.zoneId as string
        const zone = zones.value.find(z => z.id === selectedZone.value)
        if (zone) zoneName.value = zone.name
        await loadRecords()
      } else if (zones.value.length > 0) {
        selectedZone.value = zones.value[0].id
        zoneName.value = zones.value[0].name
        await loadRecords()
      }
    }
  } catch (e) {
    ElMessage.error('加载域名列表失败')
  }
}

async function loadRecords() {
  if (!selectedZone.value) return
  const zone = zones.value.find(z => z.id === selectedZone.value)
  if (zone) zoneName.value = zone.name

  loading.value = true
  try {
    const response = await window.electronAPI.http.request({
      url: `https://api.cloudflare.com/client/v4/zones/${selectedZone.value}/dns_records`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${await getApiToken()}`, 'Content-Type': 'application/json' }
    })
    if (response.success && response.data?.success) {
      records.value = response.data.result || []
    }
  } catch (e) {
    ElMessage.error('加载DNS记录失败')
  } finally {
    loading.value = false
  }
}

function filterRecords() {
  // Computed property handles filtering
}

function editRecord(record: DNSRecord) {
  editingRecord.value = record
  recordForm.value = {
    type: record.type,
    name: record.name.replace(`.${zoneName.value}`, '').replace(zoneName.value, '@'),
    content: record.content,
    proxied: record.proxied,
    ttl: record.ttl
  }
  showAddDialog.value = true
}

function closeDialog() {
  showAddDialog.value = false
  editingRecord.value = null
  recordForm.value = { type: 'A', name: '', content: '', proxied: false, ttl: 1 }
}

async function saveRecord() {
  if (!recordForm.value.name || !recordForm.value.content) {
    ElMessage.warning('请填写完整信息')
    return
  }

  saving.value = true
  try {
    const name = recordForm.value.name === '@' ? zoneName.value : `${recordForm.value.name}.${zoneName.value}`
    const body = {
      type: recordForm.value.type,
      name: name,
      content: recordForm.value.content,
      proxied: canProxy(recordForm.value.type) ? recordForm.value.proxied : false,
      ttl: recordForm.value.ttl
    }

    let url = `https://api.cloudflare.com/client/v4/zones/${selectedZone.value}/dns_records`
    let method = 'POST'

    if (editingRecord.value) {
      url += `/${editingRecord.value.id}`
      method = 'PUT'
    }

    const response = await window.electronAPI.http.request({
      url, method,
      headers: { 'Authorization': `Bearer ${await getApiToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    if (response.success && response.data?.success) {
      ElMessage.success(editingRecord.value ? '记录已更新' : '记录已添加')
      closeDialog()
      await loadRecords()
    } else {
      throw new Error(response.data?.errors?.[0]?.message || 'Failed')
    }
  } catch (e) {
    ElMessage.error('保存失败: ' + (e as Error).message)
  } finally {
    saving.value = false
  }
}

async function deleteRecord(record: DNSRecord) {
  await ElMessageBox.confirm(`确定要删除 ${record.name} 吗？`, '确认删除')
  try {
    const response = await window.electronAPI.http.request({
      url: `https://api.cloudflare.com/client/v4/zones/${selectedZone.value}/dns_records/${record.id}`,
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${await getApiToken()}`, 'Content-Type': 'application/json' }
    })
    if (response.success) {
      ElMessage.success('记录已删除')
      await loadRecords()
    }
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

async function updateProxy(record: DNSRecord) {
  try {
    await window.electronAPI.http.request({
      url: `https://api.cloudflare.com/client/v4/zones/${selectedZone.value}/dns_records/${record.id}`,
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${await getApiToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ proxied: record.proxied })
    })
    ElMessage.success('代理状态已更新')
  } catch (e) {
    ElMessage.error('更新失败')
    record.proxied = !record.proxied
  }
}

function canProxy(type: string): boolean {
  return ['A', 'AAAA', 'CNAME'].includes(type)
}

function getTypeTagColor(type: string): string {
  const colors: Record<string, string> = {
    A: 'primary', AAAA: 'primary', CNAME: 'success',
    MX: 'warning', TXT: 'info', NS: 'danger'
  }
  return colors[type] || 'info'
}

function formatName(name: string): string {
  if (name === zoneName.value) return '@'
  return name.replace(`.${zoneName.value}`, '')
}

function getContentPlaceholder(): string {
  const placeholders: Record<string, string> = {
    A: 'IPv4 地址，如 192.168.1.1',
    AAAA: 'IPv6 地址',
    CNAME: '目标域名',
    MX: '邮件服务器地址',
    TXT: '文本内容',
    NS: '名称服务器'
  }
  return placeholders[recordForm.value.type] || '记录内容'
}

onMounted(() => {
  loadZones()
})
</script>

<style lang="scss" scoped>
.dns-page { max-width: 1200px; margin: 0 auto; }

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

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.record-name { font-family: monospace; }
.record-content { font-family: monospace; font-size: 13px; color: var(--text-secondary); }
.form-hint { margin-left: 12px; font-size: 12px; color: var(--text-secondary); }
</style>
