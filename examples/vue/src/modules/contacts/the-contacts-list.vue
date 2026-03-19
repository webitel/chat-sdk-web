<template>
    <div>
        <h1>Contacts</h1>
    </div>
</template>

<script setup lang="ts">
import { fetchContacts } from '@webitel/chat-web-sdk';

fetchContacts();

</script>

<style scoped>

</style>