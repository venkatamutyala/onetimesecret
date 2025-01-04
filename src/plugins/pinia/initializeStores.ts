// plugins/pinia/initializeStores.ts

import { PiniaPluginContext } from 'pinia';

// export function initializeStores(options?: any) {
//   return ({ store }: PiniaPluginContext) => {
//     // Defer initialization to next tick to ensure all plugins have completed
//     queueMicrotask(() => {
//       if (typeof store.init === 'function') {
//         // Verify all required properties are available
//         if (!store.$api || !store.$asyncHandler) {
//           console.warn(
//             `[Store ${store.$id}] Missing required properties before initialization:`,
//             {
//               hasApi: !!store.$api,
//               hasAsyncHandler: !!store.$asyncHandler,
//             }
//           );
//           return;
//         }

//         store.init(options);
//       }
//     });
//   };
// }

export function initializeStores() {
  return ({ store }: PiniaPluginContext) => {
    // console.debug(`[InitializeStores0] Initializing store: ${store.$id}`);
    // console.debug(`[InitializeStores1] Preparing to initialize store: ${store.$id}`, {
    //   $api: store.$api,
    //   $asyncHandler: store.$asyncHandler,
    //   $logout: store.$logout,
    //   init: store.init,
    // });

    queueMicrotask(() => {
      // console.debug(` -> Deferred check for ${store.$id}`, {
      //   $api: store.$api,
      //   $asyncHandler: store.$asyncHandler,
      //   $logout: store.$logout,
      // });

      if (typeof store.init === 'function') {
        store.init();

        // console.debug(`[InitializeStores4] Post-init state for ${store.$id}`, {
        //   $api: store.$api,
        //   $asyncHandler: store.$asyncHandler,
        //   $logout: store.$logout,
        // });
      }
    });
  };
}
