import React from 'react';

const Navbar: React.FC = () => {
    return (
        <nav className="bg-blue-500 p-4">
            <div className="container mx-auto">
                <h1 className="text-white text-lg font-bold">Overshoot</h1>
                <ul className="flex space-x-4">
                    <li>
                        <a href="/" className="text-white hover:text-blue-200">Home</a>
                    </li>
                    <li>
                        <a href="/about" className="text-white hover:text-blue-200">About</a>
                    </li>
                    <li>
                        <a href="/contact" className="text-white hover:text-blue-200">Contact</a>
                    </li>
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;