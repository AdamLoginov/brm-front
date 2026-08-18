<template>
  <div class="container-fluid pt-4">
    <div>
      <UploadFileForm/>
    </div>
    <div>
      <MaterialTableComponent/>
    </div>
  </div>
</template>

<script setup>
    import UploadFileForm from '../UploadFileFormComponent.vue';
    import MaterialTableComponent from '../MaterialTableComponent.vue';
</script>

<style>

</style>