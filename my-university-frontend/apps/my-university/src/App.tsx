import { MainLayout } from '@app/layouts/main-layout/MainLayout';
import { StartupScreen } from '@app/pages/startup/StartupScreen';
import { useStartupGate } from '@shared/hooks';
import { AuthErrorScreen } from '@shared/ui/auth-error-screen';

function App() {
  const startupState = useStartupGate();

  if (startupState.authError) {
    return <AuthErrorScreen error={startupState.authError} />;
  }

  if (!startupState.hasApprovedUniversity) {
    return <StartupScreen state={startupState} />;
  }

  return <MainLayout />;
}

export default App;
