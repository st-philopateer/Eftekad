import React, { useRef, useState } from 'react';

export default function ProfilePicEditor({ user, onUpdated, readOnly = false }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleCircleClick = () => {
    if (readOnly) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    if (readOnly) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      window.customAlert('الرجاء اختيار ملف صورة صالح!');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      window.customAlert('حجم الصورة كبير جداً! الحد الأقصى هو 2 ميجابايت.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result;
      setUploading(true);
      try {
        const response = await fetch('/api/users/profile-pic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user.username, profilePic: base64Data })
        });
        const result = await response.json();
        if (response.ok && result.success) {
          const updatedUser = { ...user, profilePic: result.profilePic };
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          onUpdated(updatedUser);
        } else {
          window.customAlert(result.message || 'فشل تحميل الصورة.');
        }
      } catch (err) {
        console.error(err);
        window.customAlert('حدث خطأ أثناء الاتصال بالسيرفر لتحديث الصورة.');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = async (e) => {
    e.stopPropagation();
    if (readOnly) return;
    window.customConfirm('هل أنت متأكد من حذف صورة ملفك الشخصي؟', async () => {
      setUploading(true);
      try {
        const response = await fetch('/api/users/profile-pic', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user.username })
        });
        if (response.ok) {
          const updatedUser = { ...user, profilePic: null };
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          onUpdated(updatedUser);
        } else {
          window.customAlert('فشل حذف الصورة.');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setUploading(false);
      }
    });
  };

  const getInitials = (fullName) => {
    if (!fullName) return '✝';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length > 0 && parts[0]) {
      return parts[0][0].toUpperCase();
    }
    return '✝';
  };

  return (
    <div className="profile-pic-container">
      <div 
        className="profile-pic-circle" 
        onClick={handleCircleClick} 
        title={readOnly ? "" : "اضغط لتغيير الصورة الشخصية"}
        style={{ cursor: readOnly ? 'default' : 'pointer' }}
      >
        {user.profilePic ? (
          <img src={user.profilePic} alt="صورة الملف الشخصي" className="profile-pic-image" />
        ) : (
          <span>{getInitials(user.name)}</span>
        )}
        {!readOnly && (
          <div className="profile-pic-overlay">
            {uploading ? 'جاري الرفع...' : 'تعديل'}
          </div>
        )}
      </div>
      
      {user.profilePic && !readOnly && (
        <button type="button" className="profile-pic-delete-btn" onClick={handleDeletePhoto} title="حذف الصورة">
          <i className="fas fa-trash-alt"></i>
        </button>
      )}

      {/* Invisible file input */}
      {!readOnly && (
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept="image/*"
        />
      )}
    </div>
  );
}
