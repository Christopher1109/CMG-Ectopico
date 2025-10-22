"use client"

import { Home } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ResetButtonProps {
  onReset: () => void
  show?: boolean
}

export function ResetButton({ onReset, show = true }: ResetButtonProps) {
  const [showDialog, setShowDialog] = useState(false)

  if (!show) return null

  const handleConfirmReset = () => {
    setShowDialog(false)
    onReset()
  }

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        variant="outline"
        size="sm"
        className="fixed top-4 left-4 z-50 bg-white hover:bg-gray-50 border-gray-300 shadow-md"
        aria-label="Reiniciar evaluación"
      >
        <Home className="h-4 w-4 mr-2" />
        Reiniciar
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reiniciar evaluación</AlertDialogTitle>
            <AlertDialogDescription>
              Se cancelará la consulta en curso y se descartarán los datos no guardados. ¿Deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReset} className="bg-red-600 hover:bg-red-700">
              Reiniciar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
