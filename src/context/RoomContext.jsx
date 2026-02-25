import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const RoomContext = createContext();

export const useRoom = () => useContext(RoomContext);

const SOCKET_URL = `http://${window.location.hostname}:3001`;

export const RoomProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [roomState, setRoomState] = useState({
        roomCode: null,
        isHost: false,
        hostName: '',
        playerName: '',
        roomMode: 'individual', // 'sync' or 'individual'
        participants: [],
        started: false,
        examType: null,
        testFormat: null,
        results: [],
        allSubmitted: false,
        totalParticipants: 0,
        error: null,
    });
    const socketRef = useRef(null);

    // Connect socket on mount
    useEffect(() => {
        const s = io(SOCKET_URL, {
            autoConnect: false,
            transports: ['websocket', 'polling'],
        });

        s.on('connect', () => setConnected(true));
        s.on('disconnect', () => setConnected(false));

        s.on('participantJoined', ({ participants }) => {
            setRoomState(prev => ({ ...prev, participants }));
        });

        s.on('participantLeft', ({ participants }) => {
            setRoomState(prev => ({ ...prev, participants }));
        });

        s.on('roomClosed', ({ reason }) => {
            setRoomState(prev => ({
                ...prev,
                roomCode: null,
                isHost: false,
                participants: [],
                started: false,
                error: reason,
            }));
        });

        s.on('leaderboardUpdate', ({ results, totalParticipants, allSubmitted }) => {
            setRoomState(prev => ({ ...prev, results, totalParticipants, allSubmitted }));
        });

        socketRef.current = s;
        setSocket(s);

        return () => {
            s.disconnect();
        };
    }, []);

    const connectSocket = useCallback(() => {
        if (socketRef.current && !socketRef.current.connected) {
            socketRef.current.connect();
        }
    }, []);

    const createRoom = useCallback(({ hostName, examType, testFormat, questions, roomMode }) => {
        return new Promise((resolve, reject) => {
            connectSocket();
            setTimeout(() => {
                socketRef.current?.emit('createRoom', { hostName, examType, testFormat, questions, roomMode }, (response) => {
                    if (response.success) {
                        setRoomState(prev => ({
                            ...prev,
                            roomCode: response.code,
                            isHost: true,
                            hostName,
                            playerName: hostName,
                            roomMode,
                            examType,
                            testFormat,
                            participants: response.room.participants,
                            started: false,
                            error: null,
                        }));
                        resolve(response);
                    } else {
                        reject(new Error(response.error));
                    }
                });
            }, 300);
        });
    }, [connectSocket]);

    const joinRoom = useCallback(({ code, playerName }) => {
        return new Promise((resolve, reject) => {
            connectSocket();
            setTimeout(() => {
                socketRef.current?.emit('joinRoom', { code: code.toUpperCase(), playerName }, (response) => {
                    if (response.success) {
                        setRoomState(prev => ({
                            ...prev,
                            roomCode: code.toUpperCase(),
                            isHost: false,
                            playerName,
                            roomMode: response.room.roomMode,
                            examType: response.room.examType,
                            testFormat: response.room.testFormat,
                            participants: response.room.participants,
                            started: false,
                            error: null,
                        }));
                        resolve(response);
                    } else {
                        reject(new Error(response.error));
                    }
                });
            }, 300);
        });
    }, [connectSocket]);

    const startRoom = useCallback(() => {
        return new Promise((resolve, reject) => {
            socketRef.current?.emit('startRoom', { code: roomState.roomCode }, (response) => {
                if (response.success) {
                    setRoomState(prev => ({ ...prev, started: true }));
                    resolve(response);
                } else {
                    reject(new Error(response.error));
                }
            });
        });
    }, [roomState.roomCode]);

    const syncNavigate = useCallback((questionIndex) => {
        if (roomState.isHost && roomState.roomMode === 'sync') {
            socketRef.current?.emit('syncNavigate', { code: roomState.roomCode, questionIndex });
        }
    }, [roomState.roomCode, roomState.isHost, roomState.roomMode]);

    const submitResults = useCallback((resultData) => {
        return new Promise((resolve, reject) => {
            socketRef.current?.emit('submitResults', {
                code: roomState.roomCode,
                playerName: roomState.playerName,
                ...resultData,
            }, (response) => {
                if (response?.success) resolve(response);
                else reject(new Error(response?.error || 'Submit failed'));
            });
        });
    }, [roomState.roomCode, roomState.playerName]);

    const getLeaderboard = useCallback(() => {
        return new Promise((resolve, reject) => {
            socketRef.current?.emit('getLeaderboard', { code: roomState.roomCode }, (response) => {
                if (response.success) {
                    setRoomState(prev => ({
                        ...prev,
                        results: response.results,
                        totalParticipants: response.totalParticipants,
                        allSubmitted: response.allSubmitted,
                    }));
                    resolve(response);
                } else {
                    reject(new Error(response.error));
                }
            });
        });
    }, [roomState.roomCode]);

    const leaveRoom = useCallback(() => {
        socketRef.current?.disconnect();
        socketRef.current?.connect();
        setRoomState({
            roomCode: null,
            isHost: false,
            hostName: '',
            playerName: '',
            roomMode: 'individual',
            participants: [],
            started: false,
            examType: null,
            testFormat: null,
            results: [],
            allSubmitted: false,
            totalParticipants: 0,
            error: null,
        });
    }, []);

    return (
        <RoomContext.Provider value={{
            socket: socketRef.current,
            connected,
            ...roomState,
            createRoom,
            joinRoom,
            startRoom,
            leaveRoom,
            syncNavigate,
            submitResults,
            getLeaderboard,
        }}>
            {children}
        </RoomContext.Provider>
    );
};
