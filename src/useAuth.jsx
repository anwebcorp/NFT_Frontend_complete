

import { useContext } from 'react';
import { AuthContext } from './AuthContextInstance.js';

const useAuth = () => {
  return useContext(AuthContext);
};

export default useAuth;