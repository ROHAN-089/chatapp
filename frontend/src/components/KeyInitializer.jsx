import { useEffect, useState } from 'react';
import { generateAndStoreKeyPair, hasKeys, getPublicKey } from '../utils/keyManager';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';

/**
 * Key Initializer Component
 * 
 * This component handles generating and storing RSA keys for the user
 * and uploading the public key to the server.
 */
const KeyInitializer = () => {
  const [initialized, setInitialized] = useState(false);
  const [initializingKeys, setInitializingKeys] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    const initializeKeys = async () => {
      // Skip if no user is logged in or keys already initialized
      if (!user || initialized || initializingKeys) return;
      
      setInitializingKeys(true);
      
      try {
        // Check if keys already exist
        if (hasKeys()) {
          console.log('Keys already exist in localStorage');
          await uploadPublicKey();
          setInitialized(true);
          setInitializingKeys(false);
          return;
        }

        // Generate new keys
        console.log('Generating new RSA key pair...');
        await generateAndStoreKeyPair();
        console.log('Keys generated successfully');
        
        // Upload public key to server
        await uploadPublicKey();
        
        setInitialized(true);
        toast.success('Encryption keys generated successfully');
      } catch (error) {
        console.error('Failed to initialize keys:', error);
        toast.error('Failed to set up encryption keys');
      } finally {
        setInitializingKeys(false);
      }
    };

    initializeKeys();
  }, [user, initialized]);

  // Upload the public key to the server
  const uploadPublicKey = async () => {
    if (!user) return;
    
    try {
      const publicKey = getPublicKey();
      if (!publicKey) throw new Error('No public key found');
      
      await axiosInstance.post('/auth/update-public-key', { publicKey });
      console.log('Public key uploaded to server');
    } catch (error) {
      console.error('Failed to upload public key:', error);
      throw error;
    }
  };

  // This is a utility component that doesn't render anything visible
  return null;
};

export default KeyInitializer;
