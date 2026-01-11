import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if token exists and validate (optional: call /users/me)
        if (token) {
            fetchUser(token);
        } else {
            setLoading(false);
        }
    }, [token]);

    const fetchUser = async (authToken) => {
        console.log("BROWSER LOG: fetchUser called with token", authToken ? "present" : "missing");
        try {
            console.log("BROWSER LOG: calling api.get /users/me");
            const response = await api.get('/users/me');
            console.log("BROWSER LOG: api.get response", response.status);
            setUser(response.data);
            return response.data;
        } catch (error) {
            console.error("Failed to fetch user", error);
            logout();
        } finally {
            setLoading(false);
        }
        return null;
    };

    const login = async (email, password) => {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        try {
            const response = await api.post('/token', formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            });

            const accessToken = response.data.access_token;
            localStorage.setItem('token', accessToken);
            setToken(accessToken);
            // api interceptor will now pick up the token
            return await fetchUser(accessToken);
        } catch (error) {
            console.error("Login Check Failed", error);
            throw error.response?.data || { detail: 'Login failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading, isAdmin: user?.role === 'admin' }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
