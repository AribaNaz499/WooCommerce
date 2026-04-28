import useModal from '../../../hooks/useModal'
import DashboardLayout from '../../../layout/DashboardLayout'
import AdminCommunityPanel from './components/AdminCommunityPanel/AdminCommunityPanel'
import CommunityPostModal from './components/CommunityPostModal/CommunityPostModal'

const OurCommunityHub = () => {

    const { open: isCommunityModal, openModal: openCommunityModal, closeModal: closeCommunityModal } = useModal()

    return (
        <DashboardLayout title='Our Community' addBtn='Add Post' onClick={openCommunityModal}>
            <AdminCommunityPanel />

            {
                isCommunityModal && (
                    <CommunityPostModal open={isCommunityModal} onCloseModal={closeCommunityModal} title='Community Post' />
                )
            }
        </DashboardLayout>
    )
}

export default OurCommunityHub