import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Calendar, MapPin, Users } from 'lucide-react';
import axios from 'axios';

const Tournaments = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTournaments();
  }, [filter]);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await axios.get('/api/tournaments', { params });
      setTournaments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Cricket Tournaments</h1>
          
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            {['all', 'upcoming', 'active', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === status
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {tournaments.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tournaments found</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'No tournaments are currently available.' 
                : `No ${filter} tournaments found.`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <div
                key={tournament._id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                      {tournament.name}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tournament.status)}`}>
                      {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                    </span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{tournament.location}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>
                        {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Trophy className="h-4 w-4 mr-2" />
                      <span>{tournament.format} Format</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      <span>Organizer: {tournament.organizer?.name || 'Unknown'}</span>
                    </div>
                  </div>

                  {tournament.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {tournament.description}
                    </p>
                  )}

                  <Link
                    to={`/tournament/${tournament._id}`}
                    className="block w-full text-center bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors font-medium"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tournaments;