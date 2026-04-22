<!--
    根据路由的entityKey作为请求数据依据

    配置项从features/entities*/module.ts提取

    配置项需要有
  {
    entityKey: 'dsc_cal_template',
    按钮
actions:{
 showCreate: true,
      showEdit: true,
      showCopy: true,
      showDelete: true,
      showImport: false,
      showExport: false,
},
表格
     table: {
      freezeLeftKeys: ['code', 'name'],
      defaultSort: { field: 'code', order: 'asc' },
    },
关于表格详情
    detail:{


    }
  }

-->

<template>
  <div class="app-container"></div>
</template>
<script setup></script>
<style scoped lang="scss"></style>
