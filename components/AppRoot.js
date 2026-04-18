import { useApp } from '../context/AppContext';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { HomeScreen } from './screens/HomeScreen';
import { SessionScreen } from './screens/SessionScreen';
import { InsightScreen } from './screens/InsightScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { PatternsScreen } from './screens/PatternsScreen';
import { PortfolioScreen } from './screens/PortfolioScreen';
import { NewHustleScreen } from './screens/NewHustleScreen';
import { TodoScreen } from './screens/TodoScreen';

function RestartOnboardingControl({ onRestart }) {
  return (
    <button
      type="button"
      className="fixed bottom-4 right-4 z-[100] max-w-[calc(100vw-2rem)] rounded-card border border-briefly-border bg-briefly-surface px-3 py-2 text-left text-xs font-semibold text-briefly-muted shadow-brieflyCard hover:bg-briefly-page hover:text-briefly-text"
      onClick={() => {
        if (
          typeof window !== 'undefined' &&
          !window.confirm(
            'Return to onboarding? This clears your saved sessions and profile in this browser for testing.'
          )
        ) {
          return;
        }
        onRestart();
      }}
    >
      Restart onboarding
    </button>
  );
}

export default function AppRoot() {
  const { hydrated, onboardingComplete, currentScreen, resetToOnboarding } = useApp();

  if (!hydrated) {
    return <div className="min-h-screen bg-briefly-page" />;
  }

  return (
    <>
      <RestartOnboardingControl onRestart={resetToOnboarding} />
      {!onboardingComplete ? (
        <div className="min-h-screen bg-briefly-page text-briefly-text">
          <div className="briefly-fade-in-up mx-auto min-h-screen max-w-lg">
            <OnboardingScreen />
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-briefly-page text-briefly-text">
          <div key={currentScreen} className="briefly-fade-in-up mx-auto min-h-screen max-w-lg">
            {currentScreen === 'portfolio' && <PortfolioScreen />}
            {currentScreen === 'new-hustle' && <NewHustleScreen />}
            {currentScreen === 'home' && <HomeScreen />}
            {currentScreen === 'session' && <SessionScreen />}
            {currentScreen === 'insight' && <InsightScreen />}
            {currentScreen === 'history' && <HistoryScreen />}
            {currentScreen === 'patterns' && <PatternsScreen />}
            {currentScreen === 'todo' && <TodoScreen />}
          </div>
        </div>
      )}
    </>
  );
}
