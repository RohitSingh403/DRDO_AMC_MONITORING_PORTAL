import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';

const Equipment = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  // Mock equipment data
  const equipmentList = [
    {
      id: 'EQ-1001',
      name: 'HVAC Unit #5',
      type: 'HVAC',
      model: 'Trane XR16',
      serialNumber: 'TRN-XR16-2023-0042',
      location: 'Main Building - 3rd Floor',
      status: 'operational',
      lastMaintenance: '2023-05-15',
      nextMaintenance: '2023-07-15',
      maintenanceHistory: [
        { date: '2023-05-15', type: 'Routine', technician: 'John D.', notes: 'Filter replacement and system check' },
        { date: '2023-03-10', type: 'Inspection', technician: 'Sarah M.', notes: 'Seasonal inspection' },
      ],
    },
    {
      id: 'EQ-1002',
      name: 'Generator #2',
      type: 'Generator',
      model: 'Generac 22kW',
      serialNumber: 'GNRC-22KW-2022-0178',
      location: 'Backup Power Room',
      status: 'maintenance-due',
      lastMaintenance: '2023-02-20',
      nextMaintenance: '2023-06-20',
      maintenanceHistory: [
        { date: '2023-02-20', type: 'Oil Change', technician: 'Mike R.', notes: 'Routine oil and filter change' },
        { date: '2022-11-15', type: 'Load Test', technician: 'Mike R.', notes: 'Passed load test' },
      ],
    },
    {
      id: 'EQ-1003',
      name: 'Fire Panel A',
      type: 'Fire Safety',
      model: 'Siemens MXL',
      serialNumber: 'SMS-MXL-2021-0567',
      location: 'Main Lobby',
      status: 'operational',
      lastMaintenance: '2023-06-01',
      nextMaintenance: '2023-09-01',
      maintenanceHistory: [
        { date: '2023-06-01', type: 'Inspection', technician: 'Lisa T.', notes: 'Full system test - all devices responding' },
      ],
    },
    {
      id: 'EQ-1004',
      name: 'Elevator #1',
      type: 'Elevator',
      model: 'Otis Gen2',
      serialNumber: 'OTS-G2-2020-1234',
      location: 'North Elevator Bank',
      status: 'needs-repair',
      lastMaintenance: '2023-05-28',
      nextMaintenance: '2023-07-28',
      maintenanceHistory: [
        { date: '2023-05-28', type: 'Repair', technician: 'Carlos M.', notes: 'Door sensor replacement' },
        { date: '2023-04-15', type: 'Maintenance', technician: 'Carlos M.', notes: 'Routine maintenance' },
      ],
    },
    {
      id: 'EQ-1005',
      name: 'Water Pump #3',
      type: 'Plumbing',
      model: 'Grundfos MQ3-35',
      serialNumber: 'GRF-MQ3-2022-0089',
      location: 'Basement - Boiler Room',
      status: 'operational',
      lastMaintenance: '2023-04-10',
      nextMaintenance: '2023-10-10',
      maintenanceHistory: [
        { date: '2023-04-10', type: 'Inspection', technician: 'Tom B.', notes: 'Routine inspection - no issues found' },
      ],
    },
  ];

  // Filter equipment based on search term and filters
  const filteredEquipment = equipmentList.filter((equipment) => {
    const matchesSearch = 
      equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipment.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipment.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipment.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || equipment.status === statusFilter;
    const matchesLocation = locationFilter === 'all' || equipment.location === locationFilter;
    
    return matchesSearch && matchesStatus && matchesLocation;
  });

  // Get unique locations for filter
  const locations = [...new Set(equipmentList.map(item => item.location))];

  const statusBadges = {
    operational: { text: 'Operational', color: 'bg-green-100 text-green-800' },
    'maintenance-due': { text: 'Maintenance Due', color: 'bg-yellow-100 text-yellow-800' },
    'needs-repair': { text: 'Needs Repair', color: 'bg-red-100 text-red-800' },
    'out-of-service': { text: 'Out of Service', color: 'bg-gray-100 text-gray-800' },
  };

  const getDaysRemaining = (dateString) => {
    const today = new Date();
    const dueDate = new Date(dateString);
    const diffTime = dueDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Equipment Management</h1>
          <p className="mt-2 text-gray-600">
            Track and manage all facility equipment and maintenance history
          </p>
        </div>
        <Link
          to="/equipment/new"
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <svg
            className="-ml-1 mr-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Add Equipment
        </Link>
      </div>

      <Card className="p-6">
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="search" className="sr-only">
              Search
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="text"
                name="search"
                id="search"
                className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Search equipment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="status-filter" className="sr-only">
              Status
            </label>
            <select
              id="status-filter"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="operational">Operational</option>
              <option value="maintenance-due">Maintenance Due</option>
              <option value="needs-repair">Needs Repair</option>
              <option value="out-of-service">Out of Service</option>
            </select>
          </div>
          <div>
            <label htmlFor="location-filter" className="sr-only">
              Location
            </label>
            <select
              id="location-filter"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            >
              <option value="all">All Locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Equipment
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Location
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Last Maintenance
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Next Maintenance
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEquipment.length > 0 ? (
                      filteredEquipment.map((item) => {
                        const daysRemaining = getDaysRemaining(item.nextMaintenance);
                        const isMaintenanceDue = daysRemaining <= 7;
                        
                        return (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-md bg-blue-100 text-blue-600">
                                  <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                    />
                                  </svg>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {item.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {item.type} • {item.model}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {item.location}
                              </div>
                              <div className="text-sm text-gray-500">
                                Serial: {item.serialNumber}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadges[item.status].color}`}
                              >
                                {statusBadges[item.status].text}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(item.lastMaintenance).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {new Date(item.nextMaintenance).toLocaleDateString()}
                              </div>
                              <div className="text-sm text-gray-500">
                                {isMaintenanceDue ? (
                                  <span className="text-yellow-600">
                                    Due in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
                                  </span>
                                ) : (
                                  <span className="text-green-600">
                                    {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => navigate(`/equipment/${item.id}`)}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                View
                              </button>
                              <button
                                onClick={() => navigate(`/equipment/${item.id}`, { state: { edit: true } })}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                          No equipment found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Equipment;
