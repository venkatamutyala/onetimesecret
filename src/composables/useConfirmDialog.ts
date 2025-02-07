import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { createApp } from 'vue';

interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'default';
}

export function useConfirmDialog() {
  const showConfirmDialog = (options: ConfirmDialogOptions): Promise<boolean> =>
    new Promise((resolve) => {
      // Create a container div
      const dialogContainer = document.createElement('div');
      document.body.appendChild(dialogContainer);

      const app = createApp(ConfirmDialog, {
        ...options,
        onConfirm: () => {
          app.unmount();
          dialogContainer.remove();
          resolve(true);
        },
        onCancel: () => {
          app.unmount();
          dialogContainer.remove();
          resolve(false);
        },
      });

      app.mount(dialogContainer);
    });

  return showConfirmDialog;
}
