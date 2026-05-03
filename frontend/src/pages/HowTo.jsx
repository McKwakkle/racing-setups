import { Link } from 'react-router-dom'
import '../styles/HowTo.css'

export default function HowTo() {
  return (
    <div className="container">
      <div className="howto-page">
        <h1><i className="fa-solid fa-circle-question" style={{ color: 'var(--color-primary)', marginRight: '0.5rem' }} />How to Use Obelix Motorsport</h1>
        <p className="howto-intro">
          A quick guide to browsing, creating, and managing your car setups — and keeping up with upcoming race events.
        </p>

        <div className="howto-toc">
          <h3>On this page</h3>
          <ol>
            <li><a href="#accounts">Accounts &amp; what you can see</a></li>
            <li><a href="#browsing">Browsing setups</a></li>
            <li><a href="#creating">Creating a setup</a></li>
            <li><a href="#track-specific">Track Specific vs Generic</a></li>
            <li><a href="#private">Private setups</a></li>
            <li><a href="#csv">CSV &amp; AI import</a></li>
            <li><a href="#rating">Rating &amp; bookmarking</a></li>
            <li><a href="#dashboard">Your dashboard</a></li>
            <li><a href="#events">Events</a></li>
          </ol>
        </div>

        {/* Accounts */}
        <div className="howto-section" id="accounts">
          <div className="howto-section-header">
            <i className="fa-solid fa-user-circle" />
            <h2>Accounts &amp; what you can see</h2>
          </div>

          <div className="howto-table-wrap"><table className="howto-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Not logged in</th>
                <th>Logged in</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Browse game tabs &amp; events</td><td>✅</td><td>✅</td></tr>
              <tr><td>See setup title, car, track, lap time</td><td>✅</td><td>✅</td></tr>
              <tr><td>View full setup (suspension, tires, etc.)</td><td>❌</td><td>✅</td></tr>
              <tr><td>Upvote setups</td><td>❌</td><td>✅</td></tr>
              <tr><td>Bookmark setups</td><td>❌</td><td>✅</td></tr>
              <tr><td>Create &amp; manage setups</td><td>❌</td><td>✅</td></tr>
              <tr><td>Private setup drafts</td><td>❌</td><td>✅</td></tr>
              <tr><td>Follow favourite games</td><td>❌</td><td>✅</td></tr>
              <tr><td>Upload events (ICS)</td><td>❌</td><td>✅</td></tr>
            </tbody>
          </table></div>

          <div className="howto-callout">
            <i className="fa-solid fa-circle-info" />
            <span>Creating an account is free and only needs an email + username. You can also sign up with Google or Discord in one click.</span>
          </div>
        </div>

        {/* Browsing */}
        <div className="howto-section" id="browsing">
          <div className="howto-section-header">
            <i className="fa-solid fa-magnifying-glass" />
            <h2>Browsing setups</h2>
          </div>
          <div className="howto-step">
            <div className="howto-step-num">1</div>
            <div className="howto-step-content">
              <strong>Pick a game</strong>
              <p>Click a game tab at the top to filter the grid to that game. The "All Games" tab shows everything. If you're logged in, your followed games appear first on your dashboard.</p>
            </div>
          </div>
          <div className="howto-step">
            <div className="howto-step-num">2</div>
            <div className="howto-step-content">
              <strong>Use the search bars</strong>
              <p>Filter by game name, car, track, or creator using the search bars. All filters work together — you can combine them.</p>
            </div>
          </div>
          <div className="howto-step">
            <div className="howto-step-num">3</div>
            <div className="howto-step-content">
              <strong>Click a card to open a setup</strong>
              <p>The card shows the title, car, category, and rating at a glance. Click it to open the full detail page — you'll need to be logged in to see the actual settings.</p>
            </div>
          </div>
        </div>

        {/* Creating */}
        <div className="howto-section" id="creating">
          <div className="howto-section-header">
            <i className="fa-solid fa-plus-circle" />
            <h2>Creating a setup</h2>
          </div>
          <div className="howto-callout">
            <i className="fa-solid fa-lock" />
            <span>You must be logged in to create a setup. Click <strong>New Setup</strong> in the navbar — you'll be redirected to login if needed.</span>
          </div>
          <div className="howto-step">
            <div className="howto-step-num">1</div>
            <div className="howto-step-content">
              <strong>Fill in the basics</strong>
              <p>Select the game, enter the car name, and give the setup a descriptive title. These three fields are required.</p>
            </div>
          </div>
          <div className="howto-step">
            <div className="howto-step-num">2</div>
            <div className="howto-step-content">
              <strong>Choose Generic or Track Specific</strong>
              <p>See the section below for the difference. Track Specific setups require a track name and unlock Lap Time and Track Conditions fields.</p>
            </div>
          </div>
          <div className="howto-step">
            <div className="howto-step-num">3</div>
            <div className="howto-step-content">
              <strong>Add sections and fields</strong>
              <p>Click <strong>Add Section</strong> to create groups (e.g. Suspension, Tires, Aero). Within each section, click <strong>Add Field</strong> to add key-value rows — e.g. "Front Camber" → "-2.5°". Add as many sections and fields as the game has settings.</p>
            </div>
          </div>
          <div className="howto-step">
            <div className="howto-step-num">4</div>
            <div className="howto-step-content">
              <strong>Set visibility</strong>
              <p>Toggle <strong>Public</strong> if you want others to see it right away, or <strong>Private</strong> to keep it as a draft. You can change this at any time in Edit Setup.</p>
            </div>
          </div>
          <div className="howto-step">
            <div className="howto-step-num">5</div>
            <div className="howto-step-content">
              <strong>Save</strong>
              <p>Click <strong>Save Setup</strong>. You're taken straight to the setup detail page.</p>
            </div>
          </div>
        </div>

        {/* Track Specific */}
        <div className="howto-section" id="track-specific">
          <div className="howto-section-header">
            <i className="fa-solid fa-map-location-dot" />
            <h2>Track Specific vs Generic</h2>
          </div>
          <div className="howto-table-wrap"><table className="howto-table">
            <thead>
              <tr><th>Type</th><th>When to use</th><th>Extra fields</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Generic</strong></td>
                <td>Setups that work across many tracks — typical for Forza Horizon, Assetto Corsa street builds, etc.</td>
                <td>Track is optional</td>
              </tr>
              <tr>
                <td><strong>Track Specific</strong></td>
                <td>Setups dialled in for a particular circuit — sim racing, dirt ovals, time-attack</td>
                <td>Track (required), Lap Time (optional), Conditions (optional)</td>
              </tr>
            </tbody>
          </table></div>
          <div className="howto-callout">
            <i className="fa-solid fa-circle-info" />
            <span>Track Conditions accepts free text but suggests common options like Dry, Wet, Intermediate, Muddy, and Tacky. Type anything that describes the surface.</span>
          </div>
        </div>

        {/* Private setups */}
        <div className="howto-section" id="private">
          <div className="howto-section-header">
            <i className="fa-solid fa-lock" />
            <h2>Private setups</h2>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)', lineHeight: 1.7 }}>
            When you create or edit a setup, you can mark it <strong>Private</strong>. Private setups:
          </p>
          <div className="howto-step">
            <div className="howto-step-num"><i className="fa-solid fa-eye-slash" style={{ fontSize: '0.7rem' }} /></div>
            <div className="howto-step-content">
              <strong>Only you can see them</strong>
              <p>Private setups don't appear in the browse grid or search for anyone else. Only you see them in your Dashboard → My Setups.</p>
            </div>
          </div>
          <div className="howto-step">
            <div className="howto-step-num"><i className="fa-solid fa-pen" style={{ fontSize: '0.7rem' }} /></div>
            <div className="howto-step-content">
              <strong>Make public whenever you're ready</strong>
              <p>Go to Edit Setup and flip the toggle to Public. The setup will immediately appear for everyone.</p>
            </div>
          </div>
          <div className="howto-callout">
            <i className="fa-solid fa-lightbulb" />
            <span>Use Private to build out a setup with all the sections and field names from a Duplicate, fill in the values, test it, then publish when you're happy with it.</span>
          </div>
        </div>

        {/* CSV */}
        <div className="howto-section" id="csv">
          <div className="howto-section-header">
            <i className="fa-solid fa-file-csv" />
            <h2>CSV &amp; AI import</h2>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)', lineHeight: 1.7 }}>
            The CSV import lets you fill an entire setup in seconds using an AI like ChatGPT or Claude. Here's how:
          </p>
          <div className="howto-step">
            <div className="howto-step-num">1</div>
            <div className="howto-step-content">
              <strong>Select a game first</strong>
              <p>The CSV import section only unlocks once a game is selected. This is so the importer knows which game to match.</p>
            </div>
          </div>
          <div className="howto-step">
            <div className="howto-step-num">2</div>
            <div className="howto-step-content">
              <strong>Copy the AI Prompt</strong>
              <p>Click <strong>Copy AI Prompt</strong>, paste it into ChatGPT, Claude, or any AI assistant, then describe your setup at the end of the prompt. The AI will return a properly formatted CSV.</p>
            </div>
          </div>
          <div className="howto-step">
            <div className="howto-step-num">3</div>
            <div className="howto-step-content">
              <strong>Save the CSV and upload it</strong>
              <p>Copy the AI's response into a text file saved as <code>.csv</code>, then click <strong>Upload CSV</strong>. The form auto-fills. Review and adjust any fields before saving.</p>
            </div>
          </div>
          <div className="howto-callout">
            <i className="fa-solid fa-download" />
            <span>Download the template CSV to see the exact format expected. You can fill it manually in Excel or Google Sheets if you prefer.</span>
          </div>
        </div>

        {/* Rating */}
        <div className="howto-section" id="rating">
          <div className="howto-section-header">
            <i className="fa-solid fa-thumbs-up" />
            <h2>Rating &amp; bookmarking</h2>
          </div>
          <div className="howto-step">
            <div className="howto-step-num"><i className="fa-solid fa-thumbs-up" style={{ fontSize: '0.7rem' }} /></div>
            <div className="howto-step-content">
              <strong>Upvote a setup</strong>
              <p>On the setup detail page, click the thumbs-up button to upvote. Click again to remove your vote. Upvotes feed into the creator leaderboard — the top-rated creator per game gets a purple star.</p>
            </div>
          </div>
          <div className="howto-step">
            <div className="howto-step-num"><i className="fa-solid fa-bookmark" style={{ fontSize: '0.7rem' }} /></div>
            <div className="howto-step-content">
              <strong>Bookmark a setup</strong>
              <p>Click <strong>Bookmark</strong> on any setup detail page to save it to your Dashboard → Bookmarks. Useful for setups you want to come back to.</p>
            </div>
          </div>
        </div>

        {/* Dashboard */}
        <div className="howto-section" id="dashboard">
          <div className="howto-section-header">
            <i className="fa-solid fa-gauge" />
            <h2>Your dashboard</h2>
          </div>
          <div className="howto-step">
            <div className="howto-step-num"><i className="fa-solid fa-wrench" style={{ fontSize: '0.7rem' }} /></div>
            <div className="howto-step-content">
              <strong>My Setups</strong>
              <p>All setups you've created, including private ones. Quick links to view, edit, or delete each one.</p>
            </div>
          </div>
          <div className="howto-step">
            <div className="howto-step-num"><i className="fa-solid fa-gamepad" style={{ fontSize: '0.7rem' }} /></div>
            <div className="howto-step-content">
              <strong>Followed Games</strong>
              <p>Follow the games you care about. Your followed games appear highlighted in the game tabs so you can find them instantly.</p>
            </div>
          </div>
          <div className="howto-step">
            <div className="howto-step-num"><i className="fa-solid fa-bookmark" style={{ fontSize: '0.7rem' }} /></div>
            <div className="howto-step-content">
              <strong>Bookmarks</strong>
              <p>Your saved setups from other creators. Browse and access them any time.</p>
            </div>
          </div>
          <div className="howto-step">
            <div className="howto-step-num"><i className="fa-solid fa-gear" style={{ fontSize: '0.7rem' }} /></div>
            <div className="howto-step-content">
              <strong>Settings</strong>
              <p>Change your username, update your password, and toggle email notifications when someone upvotes your setup (off by default).</p>
            </div>
          </div>

          <div style={{ marginTop: 'var(--space-md)', textAlign: 'center' }}>
            <Link to="/register" className="btn btn-primary">
              <i className="fa-solid fa-user-plus" /> Create an Account
            </Link>
          </div>
        </div>

        {/* Events */}
        <div className="howto-section" id="events">
          <div className="howto-section-header">
            <i className="fa-solid fa-calendar-days" />
            <h2>Events</h2>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)', lineHeight: 1.7 }}>
            The Events section is where upcoming race nights and one-off sessions get posted for the community to see.
            Click the <strong>Events</strong> dropdown in the tab bar and choose <strong>Recurring Events</strong> or <strong>One-off Events</strong>.
          </p>

          <div className="howto-table-wrap"><table className="howto-table">
            <thead>
              <tr><th>Type</th><th>What it is</th><th>Auto-deleted?</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Recurring</strong></td>
                <td>Race nights that repeat on a schedule — e.g. every Monday at 9pm. Shown with a purple badge.</td>
                <td>No — stays until manually removed</td>
              </tr>
              <tr>
                <td><strong>One-off</strong></td>
                <td>A single upcoming event with a specific date and time. Shown with a blue badge.</td>
                <td>Yes — automatically removed the morning after the event</td>
              </tr>
            </tbody>
          </table></div>

          <div className="howto-step">
            <div className="howto-step-num">1</div>
            <div className="howto-step-content">
              <strong>Get the ICS file from Discord</strong>
              <p>Open the Discord server, find the event in the <strong>Events</strong> section, click it, then click <strong>Interested</strong> or the download/export option to get an <code>.ics</code> file. This is a standard calendar file that contains all the event details.</p>
            </div>
          </div>
          <div className="howto-step">
            <div className="howto-step-num">2</div>
            <div className="howto-step-content">
              <strong>Go to the right events page</strong>
              <p>If the event repeats on a schedule, go to <strong>Events → Recurring Events</strong>. If it's a single date, go to <strong>Events → One-off Events</strong>. Uploading to the wrong page will be rejected automatically.</p>
            </div>
          </div>
          <div className="howto-step">
            <div className="howto-step-num">3</div>
            <div className="howto-step-content">
              <strong>Upload the ICS file</strong>
              <p>Click <strong>Choose ICS file</strong>, select your file, and a preview will appear showing the event title and schedule. Click <strong>Upload</strong> to confirm.</p>
            </div>
          </div>

          <div className="howto-callout">
            <i className="fa-solid fa-rotate" />
            <span><strong>Recurring events</strong> must repeat at least twice — a one-time "recurring" event will be rejected. If the Discord event has no repeat schedule, upload it as a One-off instead.</span>
          </div>
          <div className="howto-callout">
            <i className="fa-solid fa-trash" />
            <span><strong>One-off events</strong> are automatically deleted at 2am UTC the morning after the event date. You don't need to clean them up manually. Recurring events stay until you or an admin removes them from the events page.</span>
          </div>
          <div className="howto-callout">
            <i className="fa-solid fa-circle-info" />
            <span>Anyone can view events without an account. You need to be signed in to upload one.</span>
          </div>
        </div>

      </div>
    </div>
  )
}
