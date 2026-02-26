import { useState } from 'react';
import LandingPage from './components/LandingPage';
import PreJoinPage from './components/PreJoinPage';
import Classroom from './components/Classroom';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'prejoin' | 'classroom'>('landing');

  const handleStart = () => {
    setCurrentPage('prejoin');
  };

  const handleJoin = () => {
    setCurrentPage('classroom');
  };

  const handleEndSession = () => {
    setCurrentPage('landing');
  };

  return (
    <>
      {currentPage === 'landing' && <LandingPage onStart={handleStart} />}
      {currentPage === 'prejoin' && <PreJoinPage onJoin={handleJoin} />}
      {currentPage === 'classroom' && <Classroom onEndSession={handleEndSession} />}
    </>
  );
}
