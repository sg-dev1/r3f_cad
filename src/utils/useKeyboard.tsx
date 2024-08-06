/** This hook contains functionality handle keyboard events in three.js.
 *
 * https://sbcode.net/react-three-fiber/custom-hooks/
 */
import { useEffect, useState } from 'react';

type KeyMapType = {
  [key: string]: boolean;
};

const useKeyboard = () => {
  const [keyMap, setKeyMap] = useState<KeyMapType>({});

  useEffect(() => {
    const onDocumentKey = (e: KeyboardEvent) => {
      setKeyMap((k) => ({ ...k, [e.code]: e.type === 'keydown' }));
    };
    document.addEventListener('keydown', onDocumentKey);
    document.addEventListener('keyup', onDocumentKey);
    return () => {
      document.removeEventListener('keydown', onDocumentKey);
      document.removeEventListener('keyup', onDocumentKey);
    };
  }, []);

  return keyMap;
};

export default useKeyboard;
