import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, faArrowDown, faArrowUp, 
  faShoppingCart, faExchangeAlt, faDollarSign, 
  faStore, faHistory, faLayerGroup, faUsers
} from '@fortawesome/free-solid-svg-icons';

const Sidebar = () => {
  return (
    <div className="bg-gray-900 text-white w-60 flex flex-col h-full">
      <div className="p-4">
        <div className="flex items-center">
          <div className="text-yellow-500 text-3xl font-bold">CryptoVault</div>
        </div>
      </div>

      <nav className="flex-1 mt-4">
        <ul>
          <li className="mb-1">
            <Link to="/" className="flex items-center px-4 py-3 bg-gray-800 text-white">
              <FontAwesomeIcon icon={faHome} className="mr-3" />
              <span>Home</span>
            </Link>
          </li>
          <li className="mb-1">
            <Link to="/team" className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800">
              <FontAwesomeIcon icon={faUsers} className="mr-3" />
              <span>Team</span>
            </Link>
          </li>
          <li className="mb-1">
            <Link to="/buy" className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800">
              <FontAwesomeIcon icon={faShoppingCart} className="mr-3" />
              <span>Buy</span>
            </Link>
          </li>
          <li className="mb-1">
            <Link to="/sell" className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800">
              <FontAwesomeIcon icon={faStore} className="mr-3" />
              <span>Sell</span>
            </Link>
          </li>
          <li className="mb-1">
            <Link to="/receive" className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800">
              <FontAwesomeIcon icon={faArrowDown} className="mr-3" />
              <span>Receive</span>
            </Link>
          </li>
          <li className="mb-1">
            <Link to="/send" className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800">
              <FontAwesomeIcon icon={faArrowUp} className="mr-3" />
              <span>Send</span>
            </Link>
          </li>
          <li className="mb-1">
            <Link to="/history" className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800">
              <FontAwesomeIcon icon={faHistory} className="mr-3" />
              <span>History</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;