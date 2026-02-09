<template>
  <div class="nginx-manager">
    <div class="header">
      <h2>🌐 Nginx 管理</h2>
      <div class="actions">
        <el-button size="small" @click="refresh" :loading="loading">刷新</el-button>
        <el-button size="small" type="warning" @click="reload" :loading="reloading">重载配置</el-button>
      </div>
    </div>

    <!-- 状态卡片 -->
    <div class="status-bar" v-if="status">
      <div class="status-item">
        <span class="dot" :class="status.running ? 'green' : 'red'" />
        {{ status.running ? '运行中' : '已停止' }}
      </div>
      <div class="status-item">{{ status.version }}</div>
      <div class="status-item">配置检测: {{ status.configTest }}</div>
    </div>

    <!-- 站点列表 -->
    <div class="section">
      <h3>站点配置</h3>
      <el-empty v-if="!sites.length && !loading" description="未发现站点配置" />
      <div class="site-list">
        <div class="site-card" v-for="s in sites" :key="s.name" @click="viewConfig(s)">
          <div class="site-name">{{ s.name }}</div>
          <div class="site-file">{{ s.file }}</div>
        </div>
      </div>
    </div>

    <!-- 配置查看 -->
    <el-dialog v-model="showConfig" :title="currentSite?.name" width="70%" destroy-on-close>
      <pre class="config-content">{{ configContent }}</pre>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const api = (window as any).__pluginAPI
const serverId = () => api?.currentServerId

const loading = ref(false)
const reloading = ref(false)
const status = ref<any>(null)
const sites = ref<any[]>([])
const showConfig = ref(false)
const currentSite = ref<any>(null)
const configContent = ref('')

async function refresh() {
  if (!serverId()) return
  loading.value = true
  try {
    const [s, list] = await Promise.all([
      api.tools.call('nginx_status', { serverId: serverId() }),
      api.tools.call('nginx_sites', { serverId: serverId() })
    ])
    status.value = s
    sites.value = list || []
  } finally {
    loading.value = false
  }
}

async function viewConfig(site: any) {
  currentSite.value = site
  const r = await api.tools.call('nginx_site_config', { serverId: serverId(), site: site.file })
  configContent.value = r?.content || r?.error || 'Failed to load'
  showConfig.value = true
}

async function reload() {
  if (!serverId()) return
  reloading.value = true
  try {
    const r = await api.tools.call('nginx_reload', { serverId: serverId() })
    if (r?.success) {
      api.ui?.showNotification('Nginx 已重载', 'success')
      await refresh()
    } else {
      api.ui?.showNotification(r?.error || '重载失败', 'error')
    }
  } finally {
    reloading.value = false
  }
}

onMounted(refresh)
</script>

<style scoped>
.nginx-manager { padding: 20px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.actions { display: flex; gap: 8px; }
.status-bar { display: flex; gap: 24px; padding: 12px 16px; background: var(--bg-secondary, #1a1a2e); border-radius: 8px; margin-bottom: 20px; font-size: 14px; }
.status-item { display: flex; align-items: center; gap: 6px; }
.dot { width: 8px; height: 8px; border-radius: 50%; }
.dot.green { background: #67c23a; }
.dot.red { background: #f56c6c; }
.section h3 { margin-bottom: 12px; }
.site-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
.site-card { background: var(--bg-secondary, #1a1a2e); border: 1px solid var(--border-color, #333); border-radius: 8px; padding: 14px; cursor: pointer; transition: border-color 0.2s; }
.site-card:hover { border-color: var(--el-color-primary); }
.site-name { font-weight: 500; margin-bottom: 4px; }
.site-file { font-size: 12px; color: var(--text-secondary, #888); }
.config-content { background: #0d1117; color: #e6edf3; padding: 16px; border-radius: 6px; overflow: auto; max-height: 60vh; font-size: 13px; line-height: 1.5; white-space: pre-wrap; word-break: break-all; }
</style>
