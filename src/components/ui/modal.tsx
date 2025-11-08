import type * as DialogPrimitive from '@radix-ui/react-dialog'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'

/** 
    Responsive Modal Component
    combines the `Dialog` and `Drawer` components to create a responsive dialog.
    This renders a `Dialog` component on desktop and a `Drawer` on mobile.
*/
const Modal = ({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) => {
  const isMobile = useIsMobile()

  return isMobile ? <Drawer {...props} /> : <Dialog {...props} />
}

const ModalClose = ({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) => {
  const isMobile = useIsMobile()

  return isMobile ? <DrawerClose {...props} /> : <DialogClose {...props} />
}

const ModalContent = ({
  showCloseButton,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) => {
  const isMobile = useIsMobile()

  return isMobile ? (
    <DrawerContent {...props} />
  ) : (
    <DialogContent showCloseButton={showCloseButton} {...props} />
  )
}

const ModalDescription = ({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) => {
  const isMobile = useIsMobile()

  return isMobile ? (
    <DrawerDescription {...props} />
  ) : (
    <DialogDescription {...props} />
  )
}

const ModalFooter = ({ ...props }: React.ComponentProps<'div'>) => {
  const isMobile = useIsMobile()

  return isMobile ? <DrawerFooter {...props} /> : <DialogFooter {...props} />
}

const ModalHeader = ({ ...props }: React.ComponentProps<'div'>) => {
  const isMobile = useIsMobile()

  return isMobile ? <DrawerHeader {...props} /> : <DialogHeader {...props} />
}

const ModalTitle = ({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) => {
  const isMobile = useIsMobile()

  return isMobile ? <DrawerTitle {...props} /> : <DialogTitle {...props} />
}

const ModalTrigger = ({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) => {
  const isMobile = useIsMobile()

  return isMobile ? <DrawerTrigger {...props} /> : <DialogTrigger {...props} />
}

export {
  Modal,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
}
