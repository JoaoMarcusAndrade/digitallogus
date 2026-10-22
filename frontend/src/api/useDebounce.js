/* ============================================================
   Alexandria — Hook de debounce (evita requisição a cada tecla)
   ============================================================ */

import { useEffect, useState } from 'react';

export function useDebounce(valor, atraso = 300) {
  const [atrasado, setAtrasado] = useState(valor);

  useEffect(() => {
    const timer = setTimeout(() => setAtrasado(valor), atraso);
    return () => clearTimeout(timer);
  }, [valor, atraso]);

  return atrasado;
}

export default useDebounce;
