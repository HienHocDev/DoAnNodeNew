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
      setMessage({ type: 'success', text: 'Cập nhật hồ sơ thành công!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    if (!password) {
      setMessage({ type: 'error', text: 'Vui lòng nhập mật khẩu mới' });
      return;
    }
    setLoading(true);
    try {
      const updatedUser = await updateProfile({ password });
      const token = localStorage.getItem('token');
      loginContext(updatedUser, token);
      setMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      setPassword('');
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Ảnh không được vượt quá 5MB' });
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
      setMessage({ type: 'success', text: 'Đã tải xuống bản sao lưu dữ liệu!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Không thể tạo bản sao lưu lúc này.' });
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6 border-b dark:border-gray-700 pb-4">Hồ sơ cá nhân</h3>
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
                  Thay đổi ảnh đại diện
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Định dạng JPG, PNG. Tối đa 5MB.</p>
              </div>
            </div>

            <form className="max-w-md space-y-5" onSubmit={handleSubmitProfile}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Họ và tên</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email <span className="text-gray-400 text-xs font-normal">(Không thể thay đổi)</span></label>
                <input 
                  type="email" 
                  value={email}
                  disabled
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm text-gray-500 dark:text-gray-500 outline-none cursor-not-allowed" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Số điện thoại</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Nhập số điện thoại..."
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none" 
                />
              </div>
              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Đang lưu...' : 'Lưu hồ sơ'}
                </button>
              </div>
            </form>
          </>
        );

      case 'password':
        return (
          <>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6 border-b dark:border-gray-700 pb-4">Đổi mật khẩu</h3>
            <form className="max-w-md space-y-5" onSubmit={handleSubmitPassword}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mật khẩu mới</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Nhập mật khẩu mới"
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none" 
                />
              </div>
              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Đang lưu...' : 'Lưu mật khẩu'}
                </button>
              </div>
            </form>
          </>
        );

      case 'notifications':
        return (
          <>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6 border-b dark:border-gray-700 pb-4">Cài đặt thông báo</h3>
            <div className="max-w-md space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">Nhắc nhở qua Email</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nhận email khi có hóa đơn sắp đến hạn</p>
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
                  <p className="font-medium text-gray-800 dark:text-gray-200">Thông báo biến động số dư</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Thông báo khi có giao dịch lớn bất thường</p>
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
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6 border-b dark:border-gray-700 pb-4">Sao lưu dữ liệu</h3>
            <div className="max-w-md">
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                Bạn có thể tải xuống toàn bộ dữ liệu (giao dịch, ví, thông tin) để lưu trữ an toàn trên máy tính của bạn.
              </p>
              <button 
                onClick={handleBackup}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <Database className="w-4 h-4" /> Tải bản sao lưu (.JSON)
              </button>
            </div>
          </>
        );

      case 'language':
        return (
          <>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6 border-b dark:border-gray-700 pb-4">Ngôn ngữ</h3>
            <div className="max-w-md space-y-4">
              <label className="flex items-center gap-3 p-4 border dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <input 
                  type="radio" 
                  name="lang" 
                  checked={language === 'vi'} 
                  onChange={() => changeLanguage('vi')}
                  className="w-4 h-4 text-green-600 focus:ring-green-500" 
                />
                <span className="font-medium text-gray-800 dark:text-gray-200">Tiếng Việt</span>
              </label>
              <label className="flex items-center gap-3 p-4 border dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <input 
                  type="radio" 
                  name="lang" 
                  checked={language === 'en'} 
                  onChange={() => changeLanguage('en')}
                  className="w-4 h-4 text-green-600 focus:ring-green-500" 
                />
                <span className="font-medium text-gray-800 dark:text-gray-200">English (Tiếng Anh)</span>
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
    <div className="flex gap-6 min-h-[calc(100vh-8rem)]">
      {/* Sidebar Cài đặt */}
      <div className="w-64 shrink-0 space-y-1">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 px-4">{t('settings_title')}</h2>
        
        {menuItems.map(item => (
          <button 
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setMessage({ type: '', text: '' });
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              activeTab === item.id 
                ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <item.icon className="w-5 h-5" /> {item.label}
          </button>
        ))}
        
        <div className="pt-4 mt-4 border-t dark:border-gray-800 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 font-medium">
            <Moon className="w-5 h-5" /> {t('settings_dark_mode')}
          </div>
          <button 
            onClick={toggleDarkMode}
            className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer focus:outline-none ${darkMode ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`}></div>
          </button>
        </div>
      </div>

      {/* Nội dung chi tiết */}
      <div className="flex-1 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 transition-colors duration-200">
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400' : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400'}`}>
            {message.text}
          </div>
        )}
        
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Settings;
