function MyPromise(executor){
    let  self = this;
    self.status = "pending";
    self.onFullfiledCallbacks = [];
    self.onRejectedCallbacks = [];
    self.value = undefined;
    self.reason = undefined;
    // 成功的回调
    function resolve(data){
        // 保存executor传入的数据
        self.value = data;
        let {status,onFullfiledCallbacks} = self;
        if(status === "pending"){
            self.status = "resolved";
            self.onFullfiledCallbacks.forEach(fn => fn());
        }
    }
    //  失败的回调 主要是改变状态  并 达到在异步流程执行完后执行then方法里面的回调 
    function reject(data){
        // 保存executor传入的数据
        self.reason = data;
        let {status,onRejectedCallbacks} = self;
        if(status==="pending"){
            self.status = "rejected";
            self.onRejectedCallbacks.forEach(fn=>fn());
        }
    }
    // executor是同步执行的，考虑到代码可能报错，我们try一下子
    try{
        executor(resolve,reject);
    }catch(e){
        // 报错了直接走失败 
        reject(e);
    }
}


function compare(x,promise2,reject,resolve){
    if(x===promise2){
        return reject(new TypeError("循环引用"))
    }
    // 避免重复调用
    var called = false;
    var then = promise2.then
    if(X!==null && (typeof x ==="funcytion" || typeof x ==="object" ) ){
        try{
            let then = x.then;
            if(typeof then === "function"){
                then.call(x,function(y){
                    if(!called){
                        called = true;
                    }else{
                        return;
                    }
                    // 如果是返回得是promise 继续处理
                    compare(y,promise2,resolve,reject);
                },function(r){
                    if(!called){
                        called = true;
                    }else{
                        return;
                    }
                    reject(r);
                })
            }else{
                // 如果返回得不是promise 直接传递x给下一个then 里得onfullfiled
                if(!called){
                    called = true;
                }else{
                    return;
                }
                resolve(x);
            }
        }catch(e){
            if(!called){
                called = true;
            }else{
                return;
            }
            reject(e)
        }

    }else{
        // 如果返回得不是对象或者方法 直接传递x给下一个then 里得onfullfiled
        resolve(x);
    }

}

MyPromise.prototype.then =function(onFulfilled,onRejected){
    //保证前后都是方法  实现值传递
    onFulfilled = typeof onFulfilled ==="function" ? onFulfilled:function(data){
        return data;
    }
    onRejected = typeof onRejected === "function" ? onRejected: function(data){
        return data;
    }

    let self = this;
    let promise2 = new MyPromise(function(reject , resolve){
        
        // 当executor中不存在异步时
        if(self.status === "resolved"){
            setTimeout(function(){
                try{
                    let x = onFulfilled(self.value);
                    compare(x,promise2,reject,resolve);
                }catch(e){
                    reject(e);
                }
                
            },0)
        } 
        if(self.status === "rejected"){
            setTimeout(function(){
                try{
                    let x = onRejected(self.reason);
                    //用于判断 上一个then 方法里回调执行完后 返回的结果类型 以及接下来的处理
                    compare(x,promise2,reject,resolve);
                }catch(e){
                    reject(e);
                }
            },0)
        }

        // executor存在异步，先将方法放入数组
        if(self.status === "pending"){
            self.onFullfiledCallbacks.push(function(){
                // 该方法主要是为了把上一个then 执行的结果拿出来
            //传递给下一个then 方法
                setTimeout(function(){
                    try{
                        let x = onFulfilled(self.value);
                        compare(x,promise2,reject,resolve);
                    }catch(e){
                        reject(e);
                    }
                })
            })
            self.onRejectedCallbacks.push(function(){
                setTimeout(function(){
                    try{
                        let x = onRejected(self.reason);
                        compare(x,promise2,reject,resolve);
                    }catch(e){
                        reject(e);
                    }
                })
            })
        }
    })
    // 支持链式调用
    return promise2;
} 



// cath就是只有reject回调的then（）
MyPromise.prototype.catch = function(rejext){
    return this.then(null,reject)
}

// Promise 明确规定状态由pending变化为resolved 或者rejected 后不得再改变  所以必须得重新来一个promise
// resovle 就是返回一个新得Promise  并让改变状态为resolved  让下一个then 方法得 onfulfilled执行
MyPromise.resolve = function(data){
    return new MyPromise((resolve,reject)=>{
        resolve(data);
    })
}

// reject  就是返回一个新的Primise  并改变状态为rejected  让接下来得then 方法得onRejected 执行
MyPromise.reject = function(data){
    return new MyPromise((resolve,reject)=>{
        reject(data);
    })
}


//剩下的写不出来了我还需要再研究研究



