import React, { useState, useEffect, useRef } from 'react';
import { User, Lock, Bell, Database, Globe, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { updateProfile } from '../../services/authService';
import { getTransactions } from '../../services/transactionService';
import { getWallets } from '../../services/walletService';

const Settings = () => {
  const { user, loginContext } = useAuth();
  const { darkMode, toggleDarkMode, language, changeLanguage, t } = useTheme();
  
  const [activeTab, setActiveTab] = useState('profile');

  // Profile States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('');
  const fileInputRef = useRef(null);
  
  // Notification States (Mock)
  const [emailNotif, setEmailNotif] = useState(true);
  const [balanceNotif, setBalanceNotif] = useState(true);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      const updateData = { name, phone };
      if (avatar !== user.avatar) {
        updateData.avatar = avatar;
      }
      const updatedUser = await updateProfile(updateData);
      const token = localStorage.getItem('token');
      loginContext(updatedUser, token);
      setMessage({ type: 'success', text: t('settings_msg_profile_success') });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || t('settings_msg_profile_error') });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    if (!password) {
      setMessage({ type: 'error', text: t('settings_msg_pwd_empty') });
      return;
    }
    setLoading(true);
    try {
      const updatedUser = await updateProfile({ password });
      const token = localStorage.getItem('token');
      loginContext(updatedUser, token);
      setMessage({ type: 'success', text: t('settings_msg_pwd_success') });
      setPassword('');
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || t('settings_msg_profile_error') });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: t('settings_msg_avatar_size') });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackup = async () => {
    try {
      const trans = await getTransactions();
      const walls = await getWallets();
      
      const backupData = {
        exportedAt: new Date().toISOString(),
        user: { name: user.name, email: user.email },
        wallets: walls,
        transactions: trans
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href",     dataStr);
      downloadAnchorNode.setAttribute("download", "finance_tracker_backup.json");
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      setMessage({ type: 'success', text: t('settings_msg_backup_success') });
    } catch (error) {
      setMessage({ type: 'error', text: t('settings_msg_backup_error') });
    }
  };

    const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6 border-b dark:border-gray-700 pb-4">{t('settings_tab_profile')}</h3>
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-700 dark:text-green-400 font-bold text-3xl border-4 border-white dark:border-gray-800 shadow-md uppercase overflow-hidden shrink-0">
                {avatar ? (
                  <img src={avatar} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  name ? name.charAt(0) : 'U'
                )}
              </div>
              <div>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/jpg"
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <button 
                  onClick={() => fileInputRef.current.click()}
                  className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('settings_profile_avatar_change')}
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t('settings_profile_avatar_hint')}</p>
              </div>
            </div>

            <form className="max-w-md space-y-5" onSubmit={handleSubmitProfile}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings_profile_name')}</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings_profile_email')} <span className="text-gray-400 text-xs font-normal">{t('settings_profile_email_hint')}</span></label>
                <input 
                  type="email" 
                  value={email}
                  disabled
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm text-gray-500 dark:text-gray-500 outline-none cursor-not-allowed" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings_profile_phone')}</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('settings_profile_phone_placeholder')}
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none" 
                />
              </div>
              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading ? t('settings_profile_saving') : t('settings_profile_save')}
                </button>
              </div>
            </form>
          </>
        );

      case 'password':
        return (
          <>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6 border-b dark:border-gray-700 pb-4">{t('settings_tab_password')}</h3>
            <form className="max-w-md space-y-5" onSubmit={handleSubmitPassword}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings_password_new')}</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={t('settings_password_new_placeholder')}
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none" 
                />
              </div>
              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading ? t('settings_profile_saving') : t('settings_password_save')}
                </button>
              </div>
            </form>
          </>
        );

      case 'notifications':
        return (
          <>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6 border-b dark:border-gray-700 pb-4">{t('settings_tab_notifications')}</h3>
            <div className="max-w-md space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{t('settings_notif_email')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings_notif_email_desc')}</p>
                </div>
                <button 
                  onClick={() => setEmailNotif(!emailNotif)}
                  className={`w-11 h-6 rounded-full relative transition-colors ${emailNotif ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${emailNotif ? 'translate-x-6' : 'translate-x-1'}`}></div>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{t('settings_notif_balance')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings_notif_balance_desc')}</p>
                </div>
                <button 
                  onClick={() => setBalanceNotif(!balanceNotif)}
                  className={`w-11 h-6 rounded-full relative transition-colors ${balanceNotif ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${balanceNotif ? 'translate-x-6' : 'translate-x-1'}`}></div>
                </button>
              </div>
            </div>
          </>
        );

      case 'backup':
        return (
          <>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6 border-b dark:border-gray-700 pb-4">{t('settings_tab_backup')}</h3>
            <div className="max-w-md">
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                {t('settings_backup_desc')}
              </p>
              <button 
                onClick={handleBackup}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <Database className="w-4 h-4" /> {t('settings_backup_btn')}
              </button>
            </div>
          </>
        );

      case 'language':
        return (
          <>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6 border-b dark:border-gray-700 pb-4">{t('settings_tab_language')}</h3>
            <div className="max-w-md space-y-4">
              <label className="flex items-center gap-3 p-4 border dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <input 
                  type="radio" 
                  name="lang" 
                  checked={language === 'vi'} 
                  onChange={() => changeLanguage('vi')}
                  className="w-4 h-4 text-green-600 focus:ring-green-500" 
                />
                <span className="font-medium text-gray-800 dark:text-gray-200">{t('settings_lang_vi')}</span>
              </label>
              <label className="flex items-center gap-3 p-4 border dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <input 
                  type="radio" 
                  name="lang" 
                  checked={language === 'en'} 
                  onChange={() => changeLanguage('en')}
                  className="w-4 h-4 text-green-600 focus:ring-green-500" 
                />
                <span className="font-medium text-gray-800 dark:text-gray-200">{t('settings_lang_en')}</span>
              </label>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const menuItems = [
    { id: 'profile', label: t('settings_profile'), icon: User },
    { id: 'password', label: t('settings_password'), icon: Lock },
    { id: 'notifications', label: t('settings_notifications'), icon: Bell },
    { id: 'backup', label: t('settings_backup'), icon: Database },
    { id: 'language', label: t('settings_language'), icon: Globe },
  ];

  return (
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 min-h-[calc(100vh-8rem)] animate-in fade-in duration-500">
      {/* Sidebar Cài đặt */}
      <div className="w-full md:w-72 shrink-0 bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 p-6 flex flex-col gap-2">
        <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100 mb-4 px-2 tracking-tight">{t('settings_title')}</h2>
        
        <div className="space-y-1">
          {menuItems.map(item => (
            <button 
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMessage({ type: '', text: '' });
              }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all duration-300 ${
                activeTab === item.id 
                  ? 'bg-gradient-to-r from-emerald-50 to-emerald-100/50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 shadow-sm border border-emerald-200/50' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 border border-transparent'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-emerald-600' : 'text-gray-400'}`} /> {item.label}
            </button>
          ))}
        </div>
        
        <div className="mt-auto pt-6 border-t border-gray-100/80 dark:border-gray-800 px-2 flex items-center justify-between">
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 font-bold text-sm">
            <Moon className="w-5 h-5 text-indigo-400" /> {t('settings_dark_mode')}
          </div>
          <button 
            onClick={toggleDarkMode}
            className={`w-12 h-6 rounded-full relative transition-colors duration-300 cursor-pointer focus:outline-none shadow-inner ${darkMode ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-300 ${darkMode ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
          </button>
        </div>
      </div>

      {/* Nội dung chi tiết */}
      <div className="flex-1 bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/60 dark:bg-gray-900 dark:border-gray-800 p-8 md:p-10 transition-colors duration-200">
        {message.text && (
          <div className={`mb-8 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-sm' : 'bg-rose-50 text-rose-700 border border-rose-200/60 shadow-sm'}`}>
            <div className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            {message.text}
          </div>
        )}
        
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Settings;
