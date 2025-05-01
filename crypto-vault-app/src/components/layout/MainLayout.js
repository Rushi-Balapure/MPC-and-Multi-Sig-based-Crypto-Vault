import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../common/Sidebar';
import Header from '../common/Header';

const MainLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-900">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-900 p-4">
          <div className="container mx-auto">
            {/* First try to render children if they're passed directly */}
            {children ? (
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            ) : (
              /* Otherwise render the Outlet for router-provided content */
              <React.Suspense fallback={<div className="text-white">Loading...</div>}>
                <ErrorBoundary>
                  <Outlet />
                </ErrorBoundary>
              </React.Suspense>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

// Simple error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error in component:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-white p-4 bg-red-900 rounded-md">
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="mb-2">There was an error loading this content.</p>
          <pre className="bg-gray-800 p-2 rounded text-sm overflow-auto">
            {this.state.error && this.state.error.toString()}
          </pre>
          <button 
            className="mt-4 bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default MainLayout;

// import React from 'react';
// import { Outlet } from 'react-router-dom';
// import Sidebar from '../common/Sidebar';
// import Header from '../common/Header';

// const MainLayout = () => {
//   return (
//     <div className="flex min-h-screen bg-gray-900">
//       {/* Sidebar */}
//       <Sidebar />
      
//       {/* Main Content */}
//       <div className="flex-1 flex flex-col overflow-hidden">
//         <Header />
        
//         <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-900 p-4">
//           <div className="container mx-auto">
//             {/* Wrap the Outlet in an error boundary or try-catch */}
//             <React.Suspense fallback={<div className="text-white">Loading...</div>}>
//               <ErrorBoundary>
//                 <Outlet />
//               </ErrorBoundary>
//             </React.Suspense>
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// };

// // Simple error boundary component
// class ErrorBoundary extends React.Component {
//   constructor(props) {
//     super(props);
//     this.state = { hasError: false, error: null };
//   }

//   static getDerivedStateFromError(error) {
//     return { hasError: true, error };
//   }

//   componentDidCatch(error, errorInfo) {
//     console.error("Error in component:", error, errorInfo);
//   }

//   render() {
//     if (this.state.hasError) {
//       return (
//         <div className="text-white p-4 bg-red-900 rounded-md">
//           <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
//           <p className="mb-2">There was an error loading this content.</p>
//           <pre className="bg-gray-800 p-2 rounded text-sm overflow-auto">
//             {this.state.error && this.state.error.toString()}
//           </pre>
//           <button 
//             className="mt-4 bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded"
//             onClick={() => this.setState({ hasError: false })}
//           >
//             Try again
//           </button>
//         </div>
//       );
//     }
//     return this.props.children;
//   }
// }

// export default MainLayout;