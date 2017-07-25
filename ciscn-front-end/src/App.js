import React, { Component } from 'react';
import logo from './img/The Matrix System.svg';
import './App.css';




class App extends Component {
    constructor(props){
        super(props);
        this.state={
            wifiSniff:true,
            fakeAP:false,
            attack:false
        };
        this.handleSniff = this.handleSniff.bind(this);
        this.handleFakeAP = this.handleFakeAP.bind(this);
        this.handleAttack = this.handleAttack.bind(this);

    }

   handleSniff(){
        this.setState({wifiSniff:true});
        this.setState({fakeAP:false});
       this.setState({attack:false});
        console.log(this.state);
   }

   handleFakeAP(){
       this.setState({wifiSniff:false});
       this.setState({fakeAP:true});
       this.setState({attack:false});
   }

   handleAttack(){
       this.setState({wifiSniff:false});
       this.setState({fakeAP:false});
       this.setState({attack:true});
   }

  render() {


    return (
     <div className="App">
         <Topbar/>
         <div id="right" style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
             <div style={{display:'flex',flexDirection:'row',alignItems:'center',position:'relative',top:'-20px',zIndex:-1}}>
         <LightButton text="Wi-Fi嗅探" handleClick={this.handleSniff} active={this.state.wifiSniff}/>
         <LightButton text="钓鱼AP" handleClick={this.handleFakeAP} active={this.state.fakeAP}/>
                 <LightButton text="渗透" handleClick={this.handleAttack} active={this.state.attack}/>
             </div>
             <div style={{width:'100%'}}>
             {this.state.wifiSniff?<WifiSniffFace/>:<div/>}
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
class TextBox extends Component{
    constructor(props){
        super(props);
        this.state={
            value:''
        }
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event){
        this.setState({value:event.target.value});
        this.props.bind(event.target.value);
    }

    render(){
        return(<input type="text" value={this.state.value} className="textbox" onChange={this.handleChange}></input>)
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
                ssid:'seu-wlan',
                rssi:-12,
                safemode:'WPA2'
            },
                1:{
                    ssid:'cmcc',
                    rssi:-100,
                    safemode:'WPA2'
                }},
            isAPGet:false,
            choose:-1
        }
        this.handleChoose = this.handleChoose.bind(this);

    }

    handleChoose(index){
        this.setState({choose:index});
        console.log('以下热点被选择：',this.state.aps[index]);
    }

    render(){
        let wifi_list=new Array();
        for (let i in this.state.aps){
            let element=<WifiStatueBar handleChoose= {this.handleChoose} ap={this.state.aps[i]} index={i} key={i}/>;
            wifi_list.push(element);
        }


        return(
            <div style={{width:'95%'}}>
                <div className="wifi-choose-panel">

                    {wifi_list}

                </div>
                <p id="chooseTitle">被选中的热点</p>
                <div id="chooseBox">
                    {this.state.choose!=-1?<WifiStatueBar ap={this.state.aps[this.state.choose]}/>:<div></div>}
                </div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Button style={{width:'60%'}} text="连接"/>
                    <Button style={{width:'40%',backgroundColor:'#C4C4C4',color:'#333333'}} text="断开"/>
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
            <p style={{width:'50%',overflow:'hidden',zIndex:4,fontFamily:'NotoSansHans-Bold',color:'#4F4F4F'}}>{this.props.ap.ssid} [{this.props.ap.safemode}]</p>
            <div className="wifi-status-bar-back">
            <div className="wifi-status-bar-front" style={{width:(-this.props.ap.rssi)+'%'}}>
            </div>
            </div>
            </div>);
    }
}

class FakeAP extends Component{
    constructor(props){
        super(props);
        this.state = {
            ssid:'',
            password:'',
            channel:0,
            safemode:'',
            isWorking:false,
            connect:0,
            data:0
        }
        this.handleSSID = this.handleSSID.bind(this);
        this.handleChannel = this.handleChannel.bind(this);
        this.handlePassword = this.handlePassword.bind(this);
        this.handleSafeMode = this.handleSafeMode.bind(this);
        this.handleClick = this.handleClick.bind(this);
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

    handleClick(){

    }

    render(){
        return(
            <div>

                <div>
                    <span>SSID</span>
                    <TextBox bind={this.handleSSID}/>
                    <span>信道</span>
                    <TextBox bind={this.handleChannel}/>
                    <span>安全模式</span>
                    <Dropdown index={['WPA','WPA2','WEP','不加密']} handleChoose={this.handleSafeMode}/>
                    <span>密钥(如果加密)</span>
                    <TextBox bind={this.handlePassword}/>
                    <Button text="开启钓鱼AP"/>
                </div>
                <div>
                    <span>钓鱼AP工作状态</span>
                    {this.state.isWorking?<p>正在工作</p>:<p>未开启</p>}
                </div>
                <div>
                    <div>
                        <p>已有</p>
                        <p>{this.state.connect}</p>
                        <p>连接</p>
                    </div>
                    <div>
                        <p>捕获</p>
                        <p>{this.state.data}</p>
                        <p>MB数据</p>
                    </div>
                </div>
            </div>
        )
    }
}



export default App;
