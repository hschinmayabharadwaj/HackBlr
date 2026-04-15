'use client';

import { useState } from 'react';
import { usePWAInstall } from '@/hooks/use-service-worker';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Download, Smartphone, Share, Plus, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function InstallPrompt() {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const { t } = useLanguage();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  
  if (isInstalled || dismissed || !canInstall) {
    return null;
  }
  
  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
    } else {
      await promptInstall();
    }
  };
  
  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-4 right-4 z-40 md:left-auto md:right-4 md:max-w-sm"
        >
          <Card className="shadow-lg border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Smartphone className="w-5 h-5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Install VoxNava</CardTitle>
                    <CardDescription className="text-xs">
                      Add to your home screen for quick access
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 -mt-1 -mr-2"
                  onClick={() => setDismissed(true)}
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Button onClick={handleInstall} className="w-full gap-2">
                <Download className="w-4 h-4" aria-hidden="true" />
                Install App
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
      
      {/* iOS Installation Instructions */}
      <Dialog open={showIOSInstructions} onOpenChange={setShowIOSInstructions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Install on iOS</DialogTitle>
            <DialogDescription>
              Follow these steps to add VoxNava to your home screen
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-primary">1</span>
              </div>
              <div>
                <p className="font-medium">Tap the Share button</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  Look for the <Share className="w-4 h-4" /> icon at the bottom of Safari
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-primary">2</span>
              </div>
              <div>
                <p className="font-medium">Scroll and tap "Add to Home Screen"</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  Look for the <Plus className="w-4 h-4" /> Add to Home Screen option
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-primary">3</span>
              </div>
              <div>
                <p className="font-medium">Tap "Add"</p>
                <p className="text-sm text-muted-foreground">
                  VoxNava will appear on your home screen
                </p>
              </div>
            </div>
          </div>
          <Button onClick={() => setShowIOSInstructions(false)} className="w-full">
            Got it!
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function InstallButton() {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const { t } = useLanguage();
  const [showInstructions, setShowInstructions] = useState(false);
  
  // Handle install click
  const handleInstall = async () => {
    if (isIOS) {
      // iOS doesn't support native install prompt, show instructions
      setShowInstructions(true);
    } else if (canInstall) {
      await promptInstall();
    } else {
      // Browser doesn't support install prompt, show instructions
      setShowInstructions(true);
    }
  };
  
  // Show installed state
  if (isInstalled) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        {t('settings.appInstalled')}
      </div>
    );
  }
  
  // Always show install options - icon button + instructions
  return (
    <>
      <div className="flex items-center gap-2">
        {/* Install Icon Button - always visible */}
        <Button
          variant="default"
          size="icon"
          className="h-10 w-10"
          onClick={handleInstall}
          aria-label={t('settings.installApp')}
          title={t('settings.installApp')}
        >
          <Download className="w-5 h-5" aria-hidden="true" />
        </Button>
        
        {/* View Instructions Button */}
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setShowInstructions(true)}
        >
          <Info className="w-4 h-4" aria-hidden="true" />
          {t('settings.viewInstructions')}
        </Button>
      </div>
      
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.howToInstall')}</DialogTitle>
            <DialogDescription>
              {t('settings.followSteps')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isIOS ? (
              <>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Tap the Share button</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      Look for the <Share className="w-4 h-4 inline" /> icon at the bottom of Safari
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Scroll and tap "Add to Home Screen"</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      Look for the <Plus className="w-4 h-4 inline" /> Add to Home Screen option
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary">3</span>
                  </div>
                  <div>
                    <p className="font-medium">Tap "Add"</p>
                    <p className="text-sm text-muted-foreground">
                      VoxNava will appear on your home screen
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Chrome / Edge (Desktop)</p>
                    <p className="text-sm text-muted-foreground">
                      Click the install icon <Download className="w-4 h-4 inline" /> in the address bar, or use menu → "Install VoxNava"
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Chrome / Samsung Internet (Android)</p>
                    <p className="text-sm text-muted-foreground">
                      Tap the three-dot menu → "Add to Home screen" or "Install app"
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary">3</span>
                  </div>
                  <div>
                    <p className="font-medium">Firefox</p>
                    <p className="text-sm text-muted-foreground">
                      Firefox has limited PWA support. For best experience, use Chrome or Edge.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
          <Button onClick={() => setShowInstructions(false)} className="w-full">
            {t('common.done')}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
