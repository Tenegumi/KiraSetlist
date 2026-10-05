Add-Type -AssemblyName System.Windows.Forms,System.Drawing
$taskAssembly=[Reflection.Assembly]::LoadFile((Join-Path $PSScriptRoot '설치하기.exe'))
$taskType=$taskAssembly.GetType('Installer')
$taskFlags=[Reflection.BindingFlags]'Instance,NonPublic'
$taskForm=$taskType.GetConstructor($taskFlags,$null,[Type[]]@(),$null).Invoke(@())
try {
 $taskForm.CreateControl()
 foreach($taskChild in $taskForm.Controls){$taskChild.CreateControl()}
 $taskBitmap=[Drawing.Bitmap]::new($taskForm.Width,$taskForm.Height)
 try {
  $taskForm.DrawToBitmap($taskBitmap,[Drawing.Rectangle]::new(0,0,$taskForm.Width,$taskForm.Height))
  # Paint the real controls offscreen, without opening a window or changing the cursor.
  $taskOrigin=$taskForm.PointToScreen([Drawing.Point]::Empty)-$taskForm.Location
  $taskGraphics=[Drawing.Graphics]::FromImage($taskBitmap)
  try {
   foreach($taskChild in @($taskForm.Controls)){
    $taskPoint=$taskChild.Location;$taskBack=$taskChild.BackColor;$taskFore=$taskChild.ForeColor;$taskFont=$taskChild.Font
    $taskForm.Controls.Remove($taskChild);$taskChild.BackColor=$taskBack;$taskChild.ForeColor=$taskFore;$taskChild.Font=$taskFont;$taskChild.Visible=$true;$taskChild.CreateControl()
    $taskChildBitmap=[Drawing.Bitmap]::new($taskChild.Width,$taskChild.Height)
    try {$taskChild.DrawToBitmap($taskChildBitmap,[Drawing.Rectangle]::new(0,0,$taskChild.Width,$taskChild.Height));$taskGraphics.DrawImageUnscaled($taskChildBitmap,($taskPoint.X+$taskOrigin.X),($taskPoint.Y+$taskOrigin.Y))} finally {$taskChildBitmap.Dispose();$taskChild.Dispose()}
   }
  } finally {$taskGraphics.Dispose()}
  $taskBitmap.Save((Join-Path $PSScriptRoot 'app/public/guide-assets/installer.png'),[Drawing.Imaging.ImageFormat]::Png)
 } finally {$taskBitmap.Dispose()}
} finally {$taskForm.Dispose()}
