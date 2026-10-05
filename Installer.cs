using System;using System.Diagnostics;using System.IO;using System.Drawing;using System.Windows.Forms;using System.Threading.Tasks;using System.Text;
class Installer:Form{
 Button install=new Button();TextBox log=new TextBox();Label status=new Label();
 Installer(){Text="키라 통합 셋리스트 설치";ClientSize=new Size(580,430);BackColor=Color.FromArgb(27,20,35);ForeColor=Color.FromArgb(241,231,249);Font=new Font("맑은 고딕",10);StartPosition=FormStartPosition.CenterScreen;FormBorderStyle=FormBorderStyle.FixedDialog;MaximizeBox=false;
  var title=new Label{Text="원본 + 앰프 DLC, 한 번에 설치하기",Font=new Font(Font.FontFamily,17,FontStyle.Bold),AutoSize=true,Location=new Point(24,28)};Controls.Add(title);
  status.Text="OBS를 닫은 다음 아래 버튼을 눌러 주세요.\n노래책 · 조작 독 · 4K / 60fps 오버레이까지 연결해요.";status.Location=new Point(26,86);status.Size=new Size(530,65);Controls.Add(status);
  install.Text="설치하고 OBS에 적용";install.Location=new Point(26,162);install.Size=new Size(525,52);install.BackColor=Color.FromArgb(192,160,228);install.ForeColor=Color.FromArgb(26,13,36);install.FlatStyle=FlatStyle.Flat;install.Click+=Install;Controls.Add(install);
  log.Multiline=true;log.ReadOnly=true;log.ScrollBars=ScrollBars.Vertical;log.Location=new Point(26,235);log.Size=new Size(525,166);log.BackColor=BackColor;log.ForeColor=ForeColor;log.BorderStyle=BorderStyle.FixedSingle;Controls.Add(log);
 }
 async void Install(object sender,EventArgs e){install.Enabled=false;status.Text="설치 중이에요. 완료되면 OBS가 열려요.";log.Text="";
  try{var start=new ProcessStartInfo("powershell.exe","-NoProfile -ExecutionPolicy Bypass -File \""+Path.Combine(AppDomain.CurrentDomain.BaseDirectory,"install.ps1")+"\""){UseShellExecute=false,CreateNoWindow=true,RedirectStandardOutput=true,RedirectStandardError=true,StandardOutputEncoding=Encoding.UTF8,StandardErrorEncoding=Encoding.UTF8};
   var p=Process.Start(start);var output=p.StandardOutput.ReadToEndAsync();var error=p.StandardError.ReadToEndAsync();await Task.Run(()=>p.WaitForExit());log.Text=await output+await error;
   if(p.ExitCode==0){status.Text="설치 완료! OBS 독 위쪽에서 원본 / 앰프 DLC를 골라 주세요.";install.Text="완료 · 다시 설치";}else status.Text="아래 안내를 확인하고 다시 눌러 주세요.";
  }catch(Exception ex){log.Text=ex.Message;status.Text="설치 파일과 app 폴더를 함께 압축 해제해 주세요.";}finally{install.Enabled=true;}
 }
 [STAThread]static void Main(){Application.EnableVisualStyles();Application.Run(new Installer());}
}
