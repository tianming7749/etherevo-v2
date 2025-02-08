import React, { useState } from "react";
import "./PrivacyModal.css";

const PrivacyModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    isOpen && (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>隐私声明与免责声明</h2>
          <p>
            欢迎使用 EtherEvo。本平台旨在提供心理健康支持，但不能替代专业医生的诊断和治疗。如有严重心理健康问题，请及时咨询专业人士。
          </p>
          <p>
            我们重视您的隐私，所有数据将严格保密，仅用于提供更好的服务。
          </p>
          <button className="modal-button" onClick={handleClose}>
            我已阅读并同意
          </button>
        </div>
      </div>
    )
  );
};

export default PrivacyModal;