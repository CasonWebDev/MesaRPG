"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { File, Image as ImageIcon, FileText, Download, ExternalLink } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

interface AttachmentViewerProps {
  attachments: string[]
  showTitle?: boolean
}

export function AttachmentViewer({ attachments, showTitle = true }: AttachmentViewerProps) {
  const [expandedImage, setExpandedImage] = useState<string | null>(null)

  if (!attachments || attachments.length === 0) {
    return null
  }

  const getFileInfo = (url: string) => {
    const fileName = url.split('/').pop() || ''
    const extension = fileName.split('.').pop()?.toLowerCase() || ''
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)
    const isPdf = extension === 'pdf'
    const isText = ['txt', 'md'].includes(extension)
    
    return { fileName, extension, isImage, isPdf, isText }
  }

  const getFileIcon = (fileInfo: ReturnType<typeof getFileInfo>) => {
    if (fileInfo.isImage) return <ImageIcon className="h-4 w-4" />
    if (fileInfo.isPdf) return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const handleDownload = (url: string, fileName: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-3">
      {showTitle && (
        <h4 className="text-sm font-medium text-muted-foreground">
          Anexos ({attachments.length})
        </h4>
      )}
      
      <div className="grid gap-2">
        {attachments.map((url, index) => {
          const fileInfo = getFileInfo(url)
          
          return (
            <Card key={index} className="p-0">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {fileInfo.isImage ? (
                    <div className="relative w-12 h-12 rounded border overflow-hidden bg-stone-50 flex-shrink-0">
                      <Image
                        src={url}
                        alt={fileInfo.fileName}
                        fill
                        className="object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setExpandedImage(url)}
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded border bg-stone-50 flex items-center justify-center flex-shrink-0">
                      {getFileIcon(fileInfo)}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {fileInfo.fileName}
                    </p>
                    <Badge variant="outline" className="text-xs text-black">
                      {fileInfo.extension.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {fileInfo.isImage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedImage(url)}
                        title="Visualizar"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(url, fileInfo.fileName)}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {/* Modal para visualizar imagem expandida */}
      {expandedImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full">
            <Image
              src={expandedImage}
              alt="Visualização da imagem"
              fill
              className="object-contain"
            />
            <Button
              variant="secondary"
              className="absolute top-4 right-4"
              onClick={() => setExpandedImage(null)}
            >
              Fechar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}