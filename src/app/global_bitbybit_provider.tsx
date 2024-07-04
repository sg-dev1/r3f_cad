/**
 * This component is a global provider for (bitbybit) occt.
 * To be retrieved using the useGlobalBitByBit() hook.
 *
 * This causes issues with bitbybit - calculations fail, so it is not used for now
 * (developed as part of B013)
 * */
import { BitByBitOCCT, OccStateEnum } from '@bitbybit-dev/occt-worker';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

const GlobalBitByBitContext = createContext<BitByBitOCCT | null>(null);

export const GlobalBitByBitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bitbybit, setBitbybit] = useState<BitByBitOCCT | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      init();
      isInitialMount.current = false;
    }
  }, []);

  const init = async () => {
    //console.log('Started init()');
    let bitbybit = new BitByBitOCCT();
    setBitbybit(bitbybit);
    const occt = new Worker(new URL('../components/3dMod/occ.worker', import.meta.url), {
      name: 'OCC',
      type: 'module',
    });
    await bitbybit.init(occt);
    //console.log('bitbybit.init(occt) finished');

    bitbybit.occtWorkerManager.occWorkerState$.subscribe(async (s) => {
      if (s.state === OccStateEnum.initialised) {
        console.log('Occt init completed (global occt)');
      } else if (s.state === OccStateEnum.computing) {
      } else if (s.state === OccStateEnum.loaded) {
      }
    });
  };

  return <GlobalBitByBitContext.Provider value={bitbybit}>{children}</GlobalBitByBitContext.Provider>;
};

export function useGlobalBitByBit() {
  const context = useContext(GlobalBitByBitContext);
  if (!context) throw new Error('Need to wrap GlobalBitByBitProvider');
  return context;
}
