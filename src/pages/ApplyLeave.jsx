import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import ApplyLeaveForm from '../components/ApplyLeaveForm';

export default function ApplyLeave() {
  const navigate = useNavigate();
  return (
    <div className="space-y-4 sm:space-y-5 max-w-2xl mx-auto">
      <PageHeader title="Apply for Leave" subtitle="Fill the form below to submit a request" />
      <div className="card p-4 sm:p-6">
        <ApplyLeaveForm onSubmitted={() => navigate('/history')} />
      </div>
    </div>
  );
}
