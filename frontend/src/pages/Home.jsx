import GameTabs from '../components/GameTabs'
import SearchBars from '../components/SearchBars'
import SetupGrid from '../components/SetupGrid'

export default function Home() {
  return (
    <div>
      <GameTabs />
      <div className="container">
        <SearchBars />
        <SetupGrid />
      </div>
    </div>
  )
}

