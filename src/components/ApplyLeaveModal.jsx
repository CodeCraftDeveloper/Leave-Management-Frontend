import Modal from './Modal';
import ApplyLeaveForm from './ApplyLeaveForm';

export default function ApplyLeaveModal({ open, onClose, defaultDate, onSuccess }) {
  const handleSubmitted = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Apply Leave">
      {open && (
        <ApplyLeaveForm
          key={defaultDate || 'today'}
          defaultDate={defaultDate}
          onSubmitted={handleSubmitted}
        />
      )}
    </Modal>
  );
}
