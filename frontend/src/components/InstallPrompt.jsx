import { useState, useEffect } from 'react';
import { ArrowDownToLine, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleClose = () => {
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md z-50"
        >
          <div className="glass border-teal/20 rounded-2xl p-5 shadow-2xl flex items-start gap-4">
            <div className="p-3 bg-teal/10 rounded-xl text-teal border border-teal/20">
              <ArrowDownToLine className="w-6 h-6" />
            </div>
            
            <div className="flex-1">
              <h4 className="font-display font-semibold text-white text-lg">Install our PWA</h4>
              <p className="text-gray-400 text-sm mt-1">
                Install this app on your screen for quick offline access and immersive fullscreen test environment.
              </p>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleInstallClick}
                  className="px-4 py-2 bg-teal text-navy font-bold rounded-lg text-sm hover:bg-opacity-95 transition-all duration-200"
                >
                  Install Now
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-white/5 text-gray-400 hover:text-white rounded-lg text-sm hover:bg-white/10 transition-all duration-200 border border-white/10"
                >
                  Not now
                </button>
              </div>
            </div>

            <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPrompt;
