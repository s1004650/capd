import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import Layout from '../components/layout/Layout';
import { UserRole } from '../types';
import { stringToDateTime } from '../types/utils';

const Messages: React.FC = () => {
  const { user } = useAuth();
  const { patients, fetchPatients, messages, addMessage, fetchMessages } = useData();
  const [messageContent, setMessageContent] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          fetchPatients(),
          fetchMessages(),
        ]);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);

  const filteredPatients = patients.filter(patient =>
    patient.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMessagesByPatient = (patientId: string) => {
    return messages
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .filter(message => message.senderId === patientId || message.receiverId === patientId);
  };

  const displayedMessages = selectedPatient
    ? getMessagesByPatient(selectedPatient ?? '') : getMessagesByPatient(user?.id ?? '');

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !user) return;

    try {
      await addMessage({
        receiverId: selectedPatient,
        content: messageContent,
        isRead: false,
      });
      setMessageContent('');
      await fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">訊息通知</h1>
        <p className="text-gray-600">
          {user?.role === UserRole.ADMIN 
            ? '與病人的訊息往來記錄' 
            : '與個案管理師的訊息往來記錄'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {user?.role === UserRole.ADMIN && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="搜尋病人..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {filteredPatients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => setSelectedPatient(patient.id)}
                    className={`w-full p-4 text-left hover:bg-gray-50 ${
                      selectedPatient === patient.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{patient.fullName}</p>
                        <p className="text-sm text-gray-500">
                          {getMessagesByPatient(patient.id).length} 則對話
                        </p>
                      </div>
                      {getMessagesByPatient(patient.id).some(m => !m.isRead && m.receiverId === user.id) && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          未讀
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className={user?.role === UserRole.ADMIN ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">訊息記錄</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {displayedMessages.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">沒有訊息</h3>
                  <p className="mt-1 text-sm text-gray-500">目前沒有任何訊息通知</p>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {displayedMessages.map((message) => {
                    const isCurrentUserSender = message.senderId === user?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isCurrentUserSender ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-lg rounded-lg p-4 ${
                            isCurrentUserSender
                              ? 'bg-blue-50 text-blue-900'
                              : 'bg-gray-50 text-gray-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                            <span>{stringToDateTime(message.createdAt)}</span>
                            {!message.isRead && !isCurrentUserSender && (
                              <span className="ml-2 text-blue-600">未讀</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {((user?.role === UserRole.ADMIN && selectedPatient) || user?.role === UserRole.PATIENT) && (
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="輸入訊息..."
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageContent.trim()}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={16} className="mr-2" />
                    發送
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Messages;