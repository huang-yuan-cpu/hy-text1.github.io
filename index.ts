// import usePigStore from './pig';
import useWarnStore from './warn';
import userEnvControl from './envControl';
// import useEnvControlSlaughter from './envControlSlaughter'

export default function useStore() {
  return {
    // pig: usePigStore(),
    warn: useWarnStore(),
    envControl: userEnvControl(),
    // envControlSlaughter: useEnvControlSlaughter()
  };
}
