import React, { useState } from 'react';

const COUNTRIES = [
    { code: '+1', flag: '🇺🇸', name: 'US' },
    { code: '+91', flag: '🇮🇳', name: 'IN' },
    { code: '+44', flag: '🇬🇧', name: 'UK' },
    { code: '+1', flag: '🇨🇦', name: 'CA' },
    { code: '+61', flag: '🇦🇺', name: 'AU' },
    { code: '+49', flag: '🇩🇪', name: 'DE' },
    { code: '+33', flag: '🇫🇷', name: 'FR' },
    { code: '+81', flag: '🇯🇵', name: 'JP' },
    { code: '+86', flag: '🇨🇳', name: 'CN' },
    { code: '+55', flag: '🇧🇷', name: 'BR' },
];

const AuthUI = ({
    authMode,
    setAuthMode,
    error,
    setError,
    setShowAuth,
    auth,
    tempUsername,
    setTempUsername,
    setDevBypass // Receive the setter
}) => {
    const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
    const [otpPreference, setOtpPreference] = useState('phone'); // 'phone' or 'email'
    const [deliveryDetails, setDeliveryDetails] = useState('');

    const handleResend = async () => {
        try {
            await auth.resendSignUpCode(tempUsername);
            alert("Code resent successfully!");
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="fade-in" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
            <div className="premium-card-elevated" style={{ maxWidth: '400px', width: '90%', padding: '40px', position: 'relative' }}>
                <h2 style={{ marginTop: 0, fontSize: '2rem', fontWeight: '900' }}>
                    {authMode === 'signin' ? 'Welcome Back' : authMode === 'signup' ? 'Join the Club' : 'Verify Identity'}
                </h2>

                {error && (
                    <div style={{
                        background: 'rgba(245, 87, 108, 0.1)',
                        borderLeft: '4px solid #f5576c',
                        padding: '12px 16px',
                        marginBottom: '20px',
                        borderRadius: '8px',
                        color: '#f5576c',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={async (e) => {
                    e.preventDefault();
                    const identifier = e.target.identifier?.value;
                    const password = e.target.password?.value;
                    const email = e.target.email?.value;
                    const rawPhone = e.target.phone?.value;
                    const code = e.target.code?.value;

                    // Format phone to E.164 (+CountryCodeNumber)
                    const formattedPhone = rawPhone ? `${selectedCountry.code}${rawPhone.replace(/\D/g, '')}` : '';

                    try {
                        if (authMode === 'signin') {
                            // Dev Bypass
                            if (identifier === 'dev' || identifier === 'dev_user') {
                                if (setDevBypass) setDevBypass(true); // Trigger bypass
                                setShowAuth(false);
                            } else {
                                await auth.signIn(identifier, password);
                                setShowAuth(false);
                            }
                        } else if (authMode === 'signup') {
                            const res = await auth.signUp(identifier, email, password, formattedPhone);
                            if (res.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
                                setTempUsername(identifier);
                                setAuthMode('confirm');
                                setError(null);
                                const dest = res.nextStep.codeDeliveryDetails?.destination || 'your device';
                                const medium = res.nextStep.codeDeliveryDetails?.deliveryMedium || 'SMS/Email';
                                setDeliveryDetails(`${medium} to ${dest}`);
                                alert(`Code sent via ${medium} to ${dest}. Please check your messages.`);
                            } else {
                                setAuthMode('signin');
                                alert("Sign up successful! Please sign in.");
                            }
                        } else if (authMode === 'confirm') {
                            await auth.confirmSignUp(tempUsername, code);
                            setAuthMode('signin');
                            alert(`${otpPreference === 'phone' ? 'Phone' : 'Email'} verified! Please sign in.`);
                        }
                        setError(null);
                    } catch (err) {
                        setError(err.message);
                    }
                }}>
                    {authMode === 'signin' && (
                        <>
                            <input name="identifier" placeholder="Email or Username" className="input-premium" style={{ marginBottom: '16px' }} required />
                            <input name="password" type="password" placeholder="Password" className="input-premium" style={{ marginBottom: '24px' }} required />
                        </>
                    )}

                    {authMode === 'signup' && (
                        <>
                            <input name="identifier" placeholder="Username" className="input-premium" style={{ marginBottom: '16px' }} required />
                            <input name="email" type="email" placeholder="Email Address" className="input-premium" style={{ marginBottom: '16px' }} required />

                            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                                <select
                                    onChange={(e) => setSelectedCountry(COUNTRIES.find(c => c.name === e.target.value))}
                                    className="input-premium"
                                    style={{ width: '90px', padding: '10px' }}
                                >
                                    {COUNTRIES.map(c => (
                                        <option key={c.name} value={c.name}>{c.flag} {c.code}</option>
                                    ))}
                                </select>
                                <input
                                    name="phone"
                                    type="tel"
                                    placeholder="Phone Number"
                                    className="input-premium"
                                    style={{ flex: 1 }}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '8px', display: 'block' }}>Send verification code via:</label>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input type="radio" name="otp_pref" value="phone" checked={otpPreference === 'phone'} onChange={() => setOtpPreference('phone')} />
                                        SMS 📱
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input type="radio" name="otp_pref" value="email" checked={otpPreference === 'email'} onChange={() => setOtpPreference('email')} />
                                        Email 📧
                                    </label>
                                </div>
                            </div>

                            <input name="password" type="password" placeholder="Password" className="input-premium" style={{ marginBottom: '8px' }} required />
                            <div style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '20px', padding: '0 5px' }}>
                                Rules: 8+ chars, Uppercase, Lowercase, Number, Symbol
                            </div>
                        </>
                    )}

                    {authMode === 'confirm' && (
                        <>
                            <p style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '20px' }}>
                                Enter the 6-digit code sent to {deliveryDetails}.
                            </p>
                            <input name="code" placeholder="6-digit code" className="input-premium" style={{ marginBottom: '24px' }} required />
                            <button type="button" onClick={handleResend} style={{
                                background: 'none', border: 'none', color: '#4ecdc4',
                                cursor: 'pointer', fontSize: '0.85rem', marginBottom: '16px', textDecoration: 'underline'
                            }}>
                                Resend Code
                            </button>
                        </>
                    )}

                    <button type="submit" className="btn-premium" style={{ width: '100%', marginBottom: '16px' }}>
                        {authMode === 'signin' ? 'Sign In' : authMode === 'signup' ? 'Create Account' : 'Verify'}
                    </button>
                </form>

                {(authMode === 'signin' || authMode === 'signup') && (
                    <p style={{ textAlign: 'center', marginTop: '16px', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}>
                        {authMode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                        <button onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                            style={{ background: 'none', border: 'none', color: '#4ecdc4', cursor: 'pointer' }}>
                            {authMode === 'signin' ? 'Sign Up' : 'Sign In'}
                        </button>
                    </p>
                )}

                <button onClick={() => setShowAuth(false)} style={{
                    position: 'absolute', top: '16px', right: '16px',
                    background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer'
                }}>×</button>
            </div>
        </div >
    );
};

export default AuthUI;
