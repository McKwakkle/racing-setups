import GameTabs from '../components/GameTabs'
import SearchBars from '../components/SearchBars'
import SetupGrid from '../components/SetupGrid'
import EventCarousel from '../components/EventCarousel'

export default function Home() {
  return (
    <div>
      <GameTabs />
      <div className="container">
        <SearchBars />
        <SetupGrid />
        <EventCarousel isRecurring={true} />
        <EventCarousel isRecurring={false} />
      </div>
    </div>
  )
}

