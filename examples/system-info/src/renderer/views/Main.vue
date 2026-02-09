<template>
  <div class="system-info-plugin">
    <div class="header">
      <h2>📊 系统信息</h2>
      <el-button size="small" @click="refresh" :loading="loading">刷新</el-button>
    </div>
    <el-empty v-if="!info" description="点击刷新获取系统信息" />
    <div v-else class="info-grid">
      <div class="info-card" v-for="(val, key) in info" :key="key">
        <div class="label">{{ key }}</div>
        <div class="value">{{ val }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const info = ref<Record<string, string> | null>(null)
const loading = ref(false)

async function refresh() {
  loading.value = true
  try {
    // Plugin API will be injected by the runtime
    const result = await (window as any).__pluginAPI?.tools.call('get_system_overview', {
      serverId: (window as any).__pluginAPI?.currentServerId
    })
    if (result) info.value = result
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.system-info-plugin { padding: 20px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px; }
.info-card { background: var(--bg-secondary, #1a1a2e); border: 1px solid var(--border-color, #333); border-radius: 8px; padding: 16px; }
.label { font-size: 12px; color: var(--text-secondary, #888); margin-bottom: 4px; text-transform: uppercase; }
.value { font-size: 16px; font-weight: 500; }
</style>
