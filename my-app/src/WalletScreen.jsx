import React from 'react';
import './Wallet.css';

const WalletScreen = () => {
    return (
        <div className="wallet-screen">
            <div className="wallet-header">
                <h1>Payments</h1>
                <div className="header-icons">
                    <button className="icon-btn">?</button>
                    <button className="icon-btn">•••</button>
                </div>
            </div>

            <div className="credit-card">
                <div className="card-logo-neo" style={{ fontSize: '24px', opacity: 0.8 }}>Saved Card</div>
                <div className="mastercard-logo">
                    <div className="mc-circle mc-red"></div>
                    <div className="mc-circle mc-orange"></div>
                </div>
            </div>

            <div className="action-buttons">
                <div className="action-item">
                    <button className="action-circle">❄️</button>
                    <span>Freeze</span>
                </div>
                <div className="action-item">
                    <button className="action-circle">👁️</button>
                    <span>View</span>
                </div>
                <div className="action-item">
                    <button className="action-circle">⚙️</button>
                    <span>Settings</span>
                </div>
            </div>
        </div>
    );
};

export default WalletScreen;
