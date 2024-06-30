/** This component contains the provider for the redux store.
 *
 * Setting up the redux store needs to live in its own component with a "use client" on top
 * Cannot add this directly to the (root) layout.tsx because there "use client" may not be used
 */
'use client';

/* Core */
import { Provider } from 'react-redux';

/* Instruments */
import { store } from './store';

export const Providers = (props: React.PropsWithChildren) => {
  return <Provider store={store}>{props.children}</Provider>;
};
