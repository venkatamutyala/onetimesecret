<!-- eslint-disable vue/multi-word-component-names -->
<!-- src/views/auth/Signup.vue -->
<script setup lang="ts">
  import AlternateSignUpMethods from '@/components/auth/AlternateSignUpMethods.vue';
  import AuthView from '@/components/auth/AuthView.vue';
  import SignUpForm from '@/components/auth/SignUpForm.vue';
  import { WindowService } from '@/services/window.service';
  import { useJurisdictionStore } from '@/stores/jurisdictionStore';
  import { storeToRefs } from 'pinia';
  import { ref, computed } from 'vue';

  const jurisdictionStore = useJurisdictionStore();
  const { getCurrentJurisdiction } = storeToRefs(jurisdictionStore);

  const default_planid = WindowService.get('default_planid') ?? 'basic';

  const currentPlanId = ref(default_planid);

  const currentJurisdiction = computed(
    () =>
      getCurrentJurisdiction.value || {
        identifier: 'Unknown Jurisdiction',
        display_name: 'Unknown Jurisdiction',
        domain: '',
        icon: {
          collection: 'mdi',
          name: 'help-circle',
        },
        enabled: false,
      }
  );

  const alternateProviders = [
    { name: 'Google', icon: 'mdi-google' },
    { name: 'GitHub', icon: 'mdi-github' },
  ];
</script>

<template>
  <AuthView
    heading="Create your account"
    heading-id="signup-heading"
    :with-subheading="true">
    <template #form>
      <SignUpForm
        :planid="currentPlanId"
        :jurisdiction="currentJurisdiction" />
      <AlternateSignUpMethods
        :alternate-providers="alternateProviders"
        class="hidden" />
    </template>
    <template #footer>
      <router-link
        to="/signin"
        class="font-medium text-brand-600 transition-colors duration-200 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300">
        {{ $t('web.signup.have_an_account') }}
      </router-link>
    </template>
  </AuthView>
</template>
