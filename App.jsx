import React, { useState, useMemo, useEffect } from 'react';
import { Users, UserPlus, Heart, Zap, ChevronsRight, Search, MessageSquare, BookOpen, Send } from 'lucide-react';


const LS_USERS_KEY = 'frs_users';
const LS_NETWORK_KEY = 'frs_network';


/**
 * Calculates the number of mutual friends between two users.
 * @param {string} userA
 * @param {string} userB
 * @param {Object<string, Set<string>>} network 
 * @returns {number} 
 */
const calculateMutualFriends = (userA, userB, network) => {
  if (!network[userA] || !network[userB]) return 0;

  const friendsA = network[userA];
  const friendsB = network[userB];
  let mutualCount = 0;

  friendsA.forEach(friend => {
    if (friendsB.has(friend)) {
      mutualCount++;
    }
  });

  return mutualCount;
};

const loadInitialState = () => {
  
  const storedUsers = localStorage.getItem(LS_USERS_KEY);
  const initialUsers = storedUsers ? JSON.parse(storedUsers) : ['Alice', 'Bob', 'Charlie', 'David', 'Eve'];

  const storedNetwork = localStorage.getItem(LS_NETWORK_KEY);
  let initialNetwork = {};

  if (storedNetwork) {
    const parsedNetwork = JSON.parse(storedNetwork);
    for (const user in parsedNetwork) {
      initialNetwork[user] = new Set(parsedNetwork[user]);
    }
  } else {
    initialNetwork = {
      'Alice': new Set(['Bob', 'Charlie']),
      'Bob': new Set(['Alice', 'David', 'Eve']),
      'Charlie': new Set(['Alice', 'David']),
      'David': new Set(['Bob', 'Charlie']),
      'Eve': new Set(['Bob']),
    };
  }
  
  return { initialUsers, initialNetwork };
};

const { initialUsers, initialNetwork } = loadInitialState();

const App = () => {
 
  const [users, setUsers] = useState(initialUsers);
  const [network, setNetwork] = useState(initialNetwork);
 
  const [activeTab, setActiveTab] = useState('recommendations'); 
  
  
  const [currentUser, setCurrentUser] = useState(initialUsers[0] || 'Alice');
  const [newUser, setNewUser] = useState('');
  const [friendA, setFriendA] = useState('');
  const [friendB, setFriendB] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [friendshipMessage, setFriendshipMessage] = useState('');
  
 
  const [icebreakerTopics, setIcebreakerTopics] = useState({}); // { user: topic }


  useEffect(() => {
    
    localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));

    // 2. Save Network (convert Sets to arrays before saving)
    const serializableNetwork = {};
    for (const user in network) {
      serializableNetwork[user] = Array.from(network[user]);
    }
    localStorage.setItem(LS_NETWORK_KEY, JSON.stringify(serializableNetwork));
  }, [users, network]);
  
  const showMessage = (msg, setter) => {
    setter(msg);
    setTimeout(() => setter(''), 3000);
  };


  const handleGenerateIcebreaker = (recommendationName) => {
  
    const staticMessage = `💡 Start a conversation about your favorite hobby or the last great movie you watched!`;
    
    setIcebreakerTopics(prev => ({ ...prev, [recommendationName]: staticMessage }));
    
    setTimeout(() => {
        setIcebreakerTopics(prev => ({ ...prev, [recommendationName]: undefined }));
    }, 5000); 
  };


  const handleAddUser = (e) => {
    e.preventDefault();
    setUserMessage('');
    
    const name = newUser.trim();
    if (name && !users.includes(name)) {
      setUsers(prevUsers => [...prevUsers, name]);
      setNetwork(prevNetwork => ({
        ...prevNetwork,
        [name]: new Set()
      }));
      showMessage(`${name} has been added to the network.`, setUserMessage);
      setNewUser('');
    } else if (users.includes(name)) {
      showMessage(`Error: User ${name} already exists.`, setUserMessage);
    }
  };

  const handleAddFriendship = (e) => {
    e.preventDefault();
    setFriendshipMessage('');
    
    const u1 = friendA.trim();
    const u2 = friendB.trim();

    if (u1 === u2) {
      showMessage("Error: Cannot be friends with yourself.", setFriendshipMessage);
      return;
    }
    if (!users.includes(u1) || !users.includes(u2)) {
      showMessage("Error: One or both users do not exist.", setFriendshipMessage);
      return;
    }
    
   
    if (network[u1] && network[u1].has(u2)) {
      showMessage(`${u1} and ${u2} are already friends!`, setFriendshipMessage);
      return;
    }

    setNetwork(prevNetwork => {

      const newNetwork = {};
      
      for (const user in prevNetwork) {
        newNetwork[user] = new Set(prevNetwork[user]);
      }
      
      if (!newNetwork[u1]) newNetwork[u1] = new Set();
      if (!newNetwork[u2]) newNetwork[u2] = new Set();

      newNetwork[u1].add(u2);
      newNetwork[u2].add(u1);
     
      showMessage(`Success! Friendship established between ${u1} and ${u2}.`, setFriendshipMessage);
      return newNetwork;
    });
    setFriendA('');
    setFriendB('');
  };



  const { friends, nonFriends, recommendations } = useMemo(() => {
    const currentFriends = network[currentUser] ? Array.from(network[currentUser]) : [];

    const nonFriendsList = users.filter(user =>
      user !== currentUser && !currentFriends.includes(user)
    );

    const potentialRecommendations = nonFriendsList.map(potentialFriend => {
      const mutualCount = calculateMutualFriends(currentUser, potentialFriend, network);
      return {
        name: potentialFriend,
        mutualFriends: mutualCount
      };
    });

    const sortedRecommendations = potentialRecommendations
      .filter(rec => rec.mutualFriends > 0)
      .sort((a, b) => b.mutualFriends - a.mutualFriends);

    return {
      friends: currentFriends,
      nonFriends: nonFriendsList,
      recommendations: sortedRecommendations
    };
  }, [currentUser, users, network]);

  const renderRecommendationCard = (rec) => {
    const topic = icebreakerTopics[rec.name];

    return (
      <div key={rec.name} className="recommendation-card">
        <div className="flex items-center space-x-2">
          <UserPlus size={18} className="text-pink-600" />
          <span className="font-semibold text-lg">{rec.name}</span>
        </div>
        <div className="text-sm text-gray-600 mt-1">
          <Heart size={14} className="inline mr-1 text-red-500" />
          {rec.mutualFriends} Mutual Friends
        </div>
        
        {/* Icebreaker Topic Display */}
        {topic && (
   
          <div className="icebreaker-topic">
            <p className="text-sm font-medium"><MessageSquare size={14} className="inline mr-1 text-blue-500"/>{topic}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          <button className="connect-button" onClick={() => {
            setFriendA(currentUser);
            setFriendB(rec.name);
            setTimeout(() => document.getElementById('add-friendship-form').requestSubmit(), 50);
          }}>
            Connect
          </button>
          
          <button 
            className="icebreaker-button" 
            onClick={() => handleGenerateIcebreaker(rec.name)}
            // Disabled logic removed
          >
            Icebreaker
          </button>
        </div>
      </div>
    );
  };
  
 

  const renderRecommendationsTab = () => (
    <>
      <div className="controls-panel">
        {/* User Selection */}
        <div className="user-select-container">
          <h2>Current User Profile</h2>
          <select
            className="user-select"
            value={currentUser}
            onChange={(e) => setCurrentUser(e.target.value)}
          >
            {users.map(user => (
              <option key={user} value={user}>
                {user} ({network[user] ? network[user].size : 0} Friends)
              </option>
            ))}
          </select>
        </div>

        {/* Add User Form */}
        <form onSubmit={handleAddUser}>
          <div className="form-title"><UserPlus size={18} /> Add New User</div>
          <div className="form-group">
            <input
              type="text"
              placeholder="New User Name"
              value={newUser}
              onChange={(e) => setNewUser(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-button">
            Register User
          </button>
          {userMessage && <div className={`message ${userMessage.startsWith('Error') ? 'error' : 'success'}`}>{userMessage}</div>}
        </form>

        {/* Add Friendship Form */}
        <form id="add-friendship-form" onSubmit={handleAddFriendship}>
          <div className="form-title"><Heart size={18} /> Establish Friendship</div>
          <div className="form-group">
            <select
              value={friendA}
              onChange={(e) => setFriendA(e.target.value)}
              required
            >
              <option value="" disabled>Select User A</option>
              {users.map(user => <option key={`a-${user}`} value={user}>{user}</option>)}
            </select>
          </div>
          <div className="form-group">
            <select
              value={friendB}
              onChange={(e) => setFriendB(e.target.value)}
              required
            >
              <option value="" disabled>Select User B</option>
              {users.map(user => <option key={`b-${user}`} value={user}>{user}</option>)}
            </select>
          </div>
          <button type="submit" className="submit-button">
            Create Mutual Connection
          </button>
          {friendshipMessage && <div className={`message ${friendshipMessage.startsWith('Error') || friendshipMessage.includes('already friends') ? 'error' : 'success'}`}>{friendshipMessage}</div>}
        </form>
      </div>

      <div className="main-content">
        <section>
          <h1 className="section-header">
            <Zap size={24} /> Recommended Friends for {currentUser}
          </h1>
          
          {recommendations.length > 0 ? (
            <div className="list-grid">
              {recommendations.map(renderRecommendationCard)}
            </div>
          ) : (
            <p className="text-gray-500">No mutual connections found yet. Try adding more friends!</p>
          )}
        </section>
        
        {/* NETWORK STATUS CONTENT ADDED HERE */}
        <section>
          <h2 className="section-header">
            <Users size={24} /> {currentUser}'s Current Friends
          </h2>
          {friends.length > 0 ? (
            <div className="list-grid">
              {friends.map(friend => (
                <div key={friend} className="friend-tag">
                  <ChevronsRight size={16} /> {friend}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">You currently have no friends.</p>
          )}
        </section>

        <section>
          <h2 className="section-header">
            <Search size={24} /> Users Not Yet Friends ({nonFriends.length})
          </h2>
          {nonFriends.length > 0 ? (
            <div className="list-grid">
              {nonFriends.map(nonFriend => (
                <div key={nonFriend} className="non-friend-tag">
                  <ChevronsRight size={16} /> {nonFriend}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">You are friends with everyone in the network!</p>
          )}
        </section>
        {/* END NETWORK STATUS CONTENT */}
      </div>
    </>
  );

 
  const renderNetworkStatusTab = () => (
    <div className="main-content full-width">
        <section>
          <h2 className="section-header">
            <Users size={24} /> {currentUser}'s Current Friends
          </h2>
          {friends.length > 0 ? (
            <div className="list-grid">
              {friends.map(friend => (
                <div key={friend} className="friend-tag">
                  <ChevronsRight size={16} /> {friend}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">You currently have no friends.</p>
          )}
        </section>

        <section>
          <h2 className="section-header">
            <Search size={24} /> Users Not Yet Friends ({nonFriends.length})
          </h2>
          {nonFriends.length > 0 ? (
            <div className="list-grid">
              {nonFriends.map(nonFriend => (
                <div key={nonFriend} className="non-friend-tag">
                  <ChevronsRight size={16} /> {nonFriend}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">You are friends with everyone in the network!</p>
          )}
        </section>
    </div>
  );
  
  const renderAboutTab = () => (
      <div className="main-content full-width">
          <section>
              <h2 className="section-header">
                <BookOpen size={24} /> About This System
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                  This application simulates a friend recommendation engine based on a **graph network** where users are nodes and friendships are mutual edges.
                  The core algorithm for recommendations is based on **Common Neighbors (Mutual Friends)**. Users who share more friends with the current user, but are not yet friends, are ranked higher.
              </p>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Data Persistence</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                  All user data, friendships, and new connections are saved directly in your browser's **Local Storage**. This ensures your network data is available even if you close and reopen the application.
              </p>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Feedback</h3>
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-yellow-800 flex items-center gap-2">
                      <Send size={18} />
                      This section is for demonstration purposes. Since the external API is not active, the **Icebreaker** button now displays a static conversation starter when clicked.
                  </p>
              </div>
          </section>
      </div>
  );
  
  const renderTabContent = () => {
      switch (activeTab) {
          case 'recommendations':
              return renderRecommendationsTab();
          case 'network_status':
              return renderNetworkStatusTab(); 
          case 'about':
              return renderAboutTab();
          default:
              return renderRecommendationsTab();
      }
  }

  return (
    <div className="app-container">
      <style>{`
        /* Global Styles */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        body { margin: 0; background-color: #f4f7f9; font-family: 'Inter', sans-serif; }

        .app-container {
          max-width: 1200px;
          margin: 40px auto;
          padding: 20px;
          background-color: #fff;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          display: flex; 
          flex-direction: column;
          gap: 20px;
        }
        
        /* New Tab Styles */
        .tabs-bar {
            display: flex;
            justify-content: center; 
            border-bottom: 2px solid #e2e8f0;
            margin-bottom: 10px;
            width: 100%;
        }

        .tab-button {
            padding: 12px 20px;
            cursor: pointer;
            font-weight: 600;
            color: #64748b;
            border: none;
            background: transparent;
            border-bottom: 3px solid transparent;
            transition: color 0.2s, border-bottom-color 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .tab-button:hover {
            color: #3b82f6;
        }

        .tab-button.active {
            color: #3b82f6;
            border-bottom-color: #3b82f6;
        }

        /* Content Area Grid */
        .content-area {
            display: grid;
            grid-template-columns: 1fr;
            gap: 30px;
        }
        
        @media (min-width: 900px) {
          .content-area {
            grid-template-columns: 1fr 2fr;
          }
          .main-content.full-width {
            grid-column: 1 / -1;
          }
        }
        

        /* Sidebar/Controls */
        .controls-panel {
          padding: 20px;
          background-color: #f8fafc;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        /* Current User Selection */
        .user-select-container {
          padding: 15px;
          border-bottom: 2px solid #e2e8f0;
          margin-bottom: 10px;
        }

        .user-select-container h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 10px;
        }

        .user-select {
          width: 100%;
          padding: 10px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          background-color: white;
          font-size: 1rem;
          color: #334155;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .user-select:focus {
          border-color: #3b82f6;
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }

        /* Form Styling */
        .form-group {
          margin-bottom: 15px;
        }

        .form-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        input[type="text"], select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 0.95rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        input[type="text"]:focus, select:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 1px #3b82f6;
          outline: none;
        }

        .submit-button {
          width: 100%;
          padding: 10px;
          background-color: #10b981;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s, transform 0.1s;
        }

        .submit-button:hover {
          background-color: #059669;
        }

        .submit-button:active {
          transform: scale(0.99);
        }

        .message {
          margin-top: 15px;
          padding: 10px;
          border-radius: 6px;
          text-align: center;
          font-weight: 500;
        }
        
        /* Specific Message Styles */
        .message.success {
            background-color: #d1fae5; /* Light green */
            color: #065f46; /* Dark green */
        }

        .message.error {
            background-color: #fee2e2; /* Light red */
            color: #991b1b; /* Dark red */
            font-size: 0.9rem;
        }

        /* Main Content Display */
        .main-content {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 40px;
        }
        
        /* System Header */
        .system-header {
            font-size: 2rem;
            font-weight: 700;
            color: #1e293b;
            padding: 10px 0;
            text-align: center;
            background-color: #e0f7ff;
            border-radius: 8px;
        }
        
        .section-header {
          font-size: 1.8rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 20px;
          border-bottom: 3px solid #f97316;
          padding-bottom: 5px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .list-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        
        /* Recommendation Card */
        .recommendation-card {
          padding: 20px;
          background: #fff;
          border: 1px solid #f0f4f8;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: border-color 0.3s;
        }

        .recommendation-card:hover {
            border-color: #f97316;
        }
        
        .action-buttons {
            display: flex;
            gap: 10px;
            margin-top: 5px;
        }

        .connect-button {
          padding: 8px 15px;
          background-color: #f97316;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
          flex-grow: 1;
        }
        
        .icebreaker-button {
          padding: 8px 15px;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
          flex-grow: 1;
        }
        
        /* The icebreaker button is always enabled now */
        .icebreaker-button:disabled {
            background-color: #3b82f6; 
            cursor: pointer;
        }
        
        .icebreaker-topic {
            margin-top: 10px;
            padding: 10px;
            border-radius: 6px;
            border: 1px solid #bfdbfe;
            background-color: #eff6ff;
            min-height: 40px;
            display: flex;
            align-items: center;
        }

        /* Friend Tag */
        .friend-tag, .non-friend-tag {
          padding: 10px 15px;
          background-color: #e0f2fe;
          border-radius: 8px;
          font-weight: 600;
          color: #0c4a6e;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: transform 0.2s;
        }

        .non-friend-tag {
          background-color: #fce7f3;
          color: #831843;
        }

        .friend-tag:hover, .non-friend-tag:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
      `}</style>
      
      <div className="system-header">Friend Recommendation System</div>
      
      {/* Tab Navigation Bar */}
      <div className="tabs-bar">
          <button 
              className={`tab-button ${activeTab === 'recommendations' ? 'active' : ''}`}
              onClick={() => setActiveTab('recommendations')}
          >
              <Zap size={18} /> Recommendations
          </button>
          <button 
              className={`tab-button ${activeTab === 'network_status' ? 'active' : ''}`}
              onClick={() => setActiveTab('network_status')}
          >
              <Users size={18} /> Network Status
          </button>
          <button 
              className={`tab-button ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => setActiveTab('about')}
          >
              <BookOpen size={18} /> About & Info
          </button>
      </div>
      
      {/* Content based on Active Tab */}
      <div className="content-area">
        {renderTabContent()}
      </div>

    </div>
  );
};

export default App;