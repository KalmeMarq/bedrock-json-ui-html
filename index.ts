
const root = document.getElementById('root') as HTMLDivElement

let profanityList: string[] = []

class Helper {
  public static setValue<E>(prop: E, value: E | undefined, defaultValue?: E): void {
    let v = value
    if(value !== undefined) v = value
    if(v !== undefined) prop = v
  }
}

let screens = new Map()
let hardcodedVars: Map<string, any> = new Map()
let globalVars: Map<string, any> = new Map()
let splashes: string[] = []
let langsList: Map<string, { [key: string]: string }> = new Map()

hardcodedVars.set('#version', '1.17.1')
hardcodedVars.set('#development_version', '347852734256347')

type Anchor = 'top_left' | 'top_middle' | 'top_right' | 'left_middle' | 'center' | 'right_middle' | 'bottom_left' | 'bottom_middle' | 'bottom_right'
class UIEl {
  private name: string = ''
  private fullname: string = ''

  protected type: string = ''
  protected layer: number = 1.0
  protected size: [number | string, number | string] = [0, 0]
  protected minSize: [number | string, number | string] = [0, 0]
  protected maxSize: [number | string, number | string] = [0, 0]
  protected offset: [number, number] = [0, 0]
  protected anchorFrom: Anchor = 'center'
  protected anchorTo: Anchor = 'center'
  protected visible: boolean = true
  protected ignored: boolean = false
  protected parent: UIEl | undefined
  protected allowClipping: boolean = true
  children: UIEl[] = []
  protected variables: Map<string, any> = new Map()
  private bindings: { binding_name?: string }[] = []

  constructor(parent: UIEl | undefined, name: string, data: { [key: string]: any }) {
    this.parent = parent
    this.fullname = name
    this.name = name.split('@')[0]
    Object.entries(data).map(prop => {
      if(prop[0].startsWith('$')) {
        this.variables.set(prop[0].split('|')[0], prop[1])
      }
    })

    this.setProp(data['type'], (v) => { this.type = v })
    this.setProp(data['layer'], (v) => { this.layer = v })
    this.setProp(data['size'], (v) => { this.size = v })
    this.setProp(data['max_size'], (v) => { this.maxSize = v })
    this.setProp(data['min_size'], (v) => { this.minSize = v })
    this.setProp(data['offset'], (v) => { this.offset = v })
    this.setProp(data['anchor_from'], (v) => { this.anchorFrom = v })
    this.setProp(data['anchor_to'], (v) => { this.anchorTo = v })
    this.setProp(data['visible'], (v) => { this.visible = v })
    this.setProp(data['allow_clipping'], (v) => { this.allowClipping = v })
    this.setProp(data['ignored'], (v) => { this.ignored = v })
    this.setProp(data['bindings'], (v) => { this.bindings = v })

    if(data['controls']) {
      (Object.values(data['controls']).map((v: any) => {
        let o: any = Object.entries(v)
        if(o[0][1]['type'] === 'panel') this.children.push(new UIElPanel(this, o[0][0], o[0][1]))
        if(o[0][1]['type'] === 'button') this.children.push(new UIElButton(this, o[0][0], o[0][1]))
        if(o[0][1]['type'] === 'image') this.children.push(new UIElImage(this, o[0][0], o[0][1]))
        if(o[0][1]['type'] === 'label') this.children.push(new UIElLabel(this, o[0][0], o[0][1]))
        if(o[0][1]['type'] === 'custom') this.children.push(new UIElCustom(this, o[0][0], o[0][1]))
        if(o[0][1]['type'] === 'stack_panel') this.children.push(new UIElStackPanel(this, o[0][0], o[0][1]))
      }))
    }
  }

  render(parent: HTMLElement) {
  }

  setProp = (value: any, callback: (f: any) => void) => {
    if(value !== undefined) {
      let v = value
      if(String(v).startsWith('$')) {
        v = this.getVariable(String(v))
      } else if(String(v).startsWith('#')) {
        let a = hardcodedVars.get(value)
        if(a !== undefined) v = a
      }

      if(v !== undefined) {
        callback(v)
      }
    }
  }

  getName(): string {
    return this.name
  }

  getVariable(name: string): any {
    if(!name.startsWith('$')) throw new Error(name + ' is not a valid variable name.')
    
    let v = this.variables.get(name)
    if(v === undefined) {
      if(this.parent !== undefined) {
        v = this.parent.getVariable(name)
        return v
      } else {
        return globalVars.get(name)
      }
    } else {
      return v
    }
  }
}

class UIElPanel extends UIEl {
  render(parent: HTMLElement) {
    let el = document.createElement('div')
    el.style.position = 'absolute'
    
    if(this.size[0] !== 0 && this.size[1] !== 0) {
      el.style.width = typeof this.size[0] === 'number' ? this.size[0] + 'px' : 'calc(' + this.size[0] + ')' 
      el.style.height = typeof this.size[1] === 'number' ? this.size[1] + 'px' : 'calc(' + this.size[1] + ')' 
    } else {
      el.style.width = '100%'
      el.style.height = '100%'
    }

    switch(this.anchorFrom) {
      case 'top_left':
        el.style.top = this.offset[1] + 'px'
        el.style.left = this.offset[0] + 'px'
        break;
      case 'top_middle':
        el.style.left = 'calc(50% + ' + this.offset[0] + 'px)'
        el.style.top = this.offset[1] + 'px'
        el.style.transform = 'translate(-50%)'
        break;
      case 'top_right':
        el.style.right = -this.offset[0] + 'px'
        el.style.top = this.offset[1] + 'px'
        break;
      case 'left_middle':
        el.style.top = 'calc(50% + ' + this.offset[1] + 'px)'
        el.style.left = this.offset[0] + 'px'
        el.style.transform = 'translate(0, -50%)'
        break;
      case 'center':
        el.style.left = 'calc(50% + ' + this.offset[0] + 'px)'
        el.style.top = 'calc(50% + ' + this.offset[1] + 'px)'
        el.style.transform = 'translate(-50%, -50%)'
        break;
      case 'right_middle':
        el.style.top = 'calc(50% + ' + this.offset[1] + 'px)'
        el.style.right = -this.offset[0] + 'px'
        el.style.transform = 'translate(0, -50%)'
        break;
      case 'bottom_left':
        el.style.top = 'calc(100% + ' + this.offset[1] + 'px)'
        el.style.left = this.offset[0] + 'px'
        el.style.transform = 'translate(0, -100%)'
        break;
      case 'bottom_middle':
        el.style.top = 'calc(100% + ' + this.offset[1] + 'px)'
        el.style.left = 'calc(50% + ' + this.offset[0] + 'px)'
        el.style.transform = 'translate(-50%, -100%)'
        break;
      case 'bottom_right':
        el.style.top = 'calc(100% + ' + this.offset[1] + 'px)'
        el.style.right = -this.offset[0] + 'px'
        el.style.transform = 'translate(0, -100%)'
        break;
  
      default:
        el.style.top = this.offset[1] + 'px'
        el.style.left = this.offset[0] + 'px'
        break;
    }

    if(this.layer !== 1.0) {
      el.style.zIndex = `${this.layer}`
    }

    if(!this.allowClipping) el.style.overflow = 'hidden'
    if(!this.visible) el.style.display = 'none'
    if(!this.ignored) parent.appendChild(el)
    this.children.map(child => child.render(el))
  }
}

class UIElStackPanel extends UIEl {
  private orientation: 'vertical' | 'horizontal' = 'vertical'

  constructor(parent: UIEl | undefined, name: string, data: { [key: string]: any }) {
    super(parent, name, data)

    this.setProp(data['orientation'], (v) => { this.orientation = v })
  }

  render(parent: HTMLElement) {
    let el = document.createElement('div')
    el.style.position = 'absolute'

    el.style.display = 'grid'
    el.style.gridAutoFlow = this.orientation === 'horizontal' ? 'column' : 'row'

    switch(this.anchorFrom) {
      case 'top_left':
        el.style.top = this.offset[1] + 'px'
        el.style.left = this.offset[0] + 'px'
        break;
      case 'top_middle':
        el.style.left = 'calc(50% + ' + this.offset[0] + 'px)'
        el.style.top = this.offset[1] + 'px'
        el.style.transform = 'translate(-50%)'
        break;
      case 'top_right':
        el.style.right = -this.offset[0] + 'px'
        el.style.top = this.offset[1] + 'px'
        break;
      case 'left_middle':
        el.style.top = 'calc(50% + ' + this.offset[1] + 'px)'
        el.style.left = this.offset[0] + 'px'
        el.style.transform = 'translate(0, -50%)'
        break;
      case 'center':
        el.style.left = 'calc(50% + ' + this.offset[0] + 'px)'
        el.style.top = 'calc(50% + ' + this.offset[1] + 'px)'
        el.style.transform = 'translate(-50%, -50%)'
        break;
      case 'right_middle':
        el.style.top = 'calc(50% + ' + this.offset[1] + 'px)'
        el.style.right = -this.offset[0] + 'px'
        el.style.transform = 'translate(0, -50%)'
        break;
      case 'bottom_left':
        el.style.top = 'calc(100% + ' + this.offset[1] + 'px)'
        el.style.left = this.offset[0] + 'px'
        el.style.transform = 'translate(0, -100%)'
        break;
      case 'bottom_middle':
        el.style.top = 'calc(100% + ' + this.offset[1] + 'px)'
        el.style.left = 'calc(50% + ' + this.offset[0] + 'px)'
        el.style.transform = 'translate(-50%, -100%)'
        break;
      case 'bottom_right':
        el.style.top = 'calc(100% + ' + this.offset[1] + 'px)'
        el.style.right = -this.offset[0] + 'px'
        el.style.transform = 'translate(0, -100%)'
        break;
  
      default:
        el.style.top = this.offset[1] + 'px'
        el.style.left = this.offset[0] + 'px'
        break;
    }

    if(this.layer !== 1.0) {
      el.style.zIndex = `${this.layer}`
    }

    if(!this.allowClipping) el.style.overflow = 'hidden'
    if(!this.visible) el.style.display = 'none'
    if(!this.ignored) parent.appendChild(el)
    this.children.map(child => child.render(el))
    el.childNodes.forEach(c => {
      (c as any).style.position = 'relative'
    })

        
    if(this.size[0] !== 0 && this.size[1] !== 0) {
      el.style.width = typeof this.size[0] === 'number' ? this.size[0] + 'px' : 'calc(' + this.size[0] + ')' 
      el.style.height = typeof this.size[1] === 'number' ? this.size[1] + 'px' : 'calc(' + this.size[1] + ')' 
    } else {
      el.style.width = 'min-content'
      el.style.height = 'max-content'
    }
  }
}

class UIElLabel extends UIEl {
  protected type: string = 'label'
  private text: string = ''
  private color: string | [number, number, number] = 'white'
  private lockedColor: string | [number, number, number] = 'white'
  private fontType: string = 'default'
  private fontSize: 'x-small' | 'small' | 'default' | 'large' | 'x-large' = 'default'
  private fontScaleFactor: number = 1.0
  private shadow: boolean = false
  private shadowColor: string | [number, number, number] = [0.0, 0.0, 0.0]
  private textAlignment: 'left' | 'center' | 'right' = 'left'
  private enableProfanityFilter: boolean = false
  private localize: boolean = true

  constructor(parent: UIEl | undefined,name: string, data: { [key: string]: any }) {
    super(parent, name, data)
    this.setProp(data['text'], (v) => { this.text = v })
    this.setProp(data['color'], (v) => { this.color = v })
    this.setProp(data['locked_color'], (v) => { this.lockedColor = v })
    this.setProp(data['font_size'], (v) => { this.fontSize = v })
    this.setProp(data['font_type'], (v) => { this.fontType = v })
    this.setProp(data['font_scale_factor'], (v) => { this.fontScaleFactor = v })
    this.setProp(data['shadow'], (v) => { this.shadow = v })
    this.setProp(data['shadow_color'], (v) => { this.shadowColor = v })
    this.setProp(data['text_alignment'], (v) => { this.textAlignment = v })
    this.setProp(data['enable_profanity_filter'], (v) => { this.enableProfanityFilter = v })
    this.setProp(data['localize'], (v) => { this.localize = v })
  }

  render(parent: HTMLElement) {
    let el = document.createElement('div')
    el.style.position = 'absolute'

    el.style.textAlign = this.textAlignment

    let a = this.enableProfanityFilter ? profanityList.some(v => v === this.text) ? this.text.split('').map(l => l = '*').join('') : this.text : this.text
    let b = langsList.get('pt_PT') as { [key: string]: string }
    let c = b[a]
    let d = c
    if(d !== undefined) {
      d = c.split('#')[0].trim()
    }
    el.innerText = c !== undefined && this.localize ? d : a

    el.style.color = typeof this.color === 'string' ? this.color : `rgb(${this.color[0] * 255}, ${this.color[1] * 255}, ${this.color[2] * 255})`
    if(this.fontType !== 'default') {
      el.style.fontFamily = this.fontType
    } else {
      el.style.fontFamily = 'minecraft'
    }
    switch(this.fontSize) {
      case 'x-small':
        el.style.fontSize = '6.5px'
        break;
      case 'small':
        el.style.fontSize = '10px'
        break;
      case 'large':
        el.style.fontSize = '40px'
        break;
      case 'x-large':
        el.style.fontSize = '60px'
        break;
      case 'default':
      default:
        el.style.fontSize = '20px'
        break;
    }

    if(this.fontScaleFactor !== 1.0) {
      el.style.fontSize = `${this.fontScaleFactor >= 1.0 ? 10 * this.fontScaleFactor : 10 * this.fontScaleFactor + 0.5}px`
    }

    if(this.shadow) {
      el.style.textShadow = `2px 2px ${typeof this.shadowColor === 'string' ? this.shadowColor : `rgb(${this.shadowColor[0] * 255}, ${this.shadowColor[1] * 255}, ${this.shadowColor[2] * 255})`}`
    }

    if(this.size[0] !== 0 && this.size[1] !== 0) {
      el.style.width = typeof this.size[0] === 'number' ? this.size[0] + 'px' : 'calc(' + this.size[0] + ')' 
      el.style.height = typeof this.size[1] === 'number' ? this.size[1] + 'px' : 'calc(' + this.size[1] + ')' 
    }

    switch(this.anchorFrom) {
      case 'top_left':
        el.style.top = this.offset[1] + 'px'
        el.style.left = this.offset[0] + 'px'
        break;
      case 'top_middle':
        el.style.left = 'calc(50% + ' + this.offset[0] + 'px)'
        el.style.top = this.offset[1] + 'px'
        el.style.transform = 'translate(-50%)'
        break;
      case 'top_right':
        el.style.right = -this.offset[0] + 'px'
        el.style.top = this.offset[1] + 'px'
        break;
      case 'left_middle':
        el.style.top = 'calc(50% + ' + this.offset[1] + 'px)'
        el.style.left = this.offset[0] + 'px'
        el.style.transform = 'translate(0, -50%)'
        break;
      case 'center':
        el.style.left = 'calc(50% + ' + this.offset[0] + 'px)'
        el.style.top = 'calc(50% + ' + this.offset[1] + 'px)'
        el.style.transform = 'translate(-50%, -50%)'
        break;
      case 'right_middle':
        el.style.top = 'calc(50% + ' + this.offset[1] + 'px)'
        el.style.right = -this.offset[0] + 'px'
        el.style.transform = 'translate(0, -50%)'
        break;
      case 'bottom_left':
        el.style.top = 'calc(100% + ' + this.offset[1] + 'px)'
        el.style.left = this.offset[0] + 'px'
        el.style.transform = 'translate(0, -100%)'
        break;
      case 'bottom_middle':
        el.style.top = 'calc(100% + ' + this.offset[1] + 'px)'
        el.style.left = 'calc(50% + ' + this.offset[0] + 'px)'
        el.style.transform = 'translate(-50%, -100%)'
        break;
      case 'bottom_right':
        el.style.top = 'calc(100% + ' + this.offset[1] + 'px)'
        el.style.right = -this.offset[0] + 'px'
        el.style.transform = 'translate(0, -100%)'
        break;
  
      default:
        el.style.top = this.offset[1] + 'px'
        el.style.left = this.offset[0] + 'px'
        break;
    }

    if(this.layer !== 1.0) {
      el.style.zIndex = `${this.layer}`
    }

    if(!this.allowClipping) el.style.overflow = 'hidden'
    if(!this.visible) el.style.display = 'none'
    if(!this.ignored) parent.appendChild(el)
    this.children.map(child => child.render(el))
  }
}

class UIElImage extends UIEl {
  private texture: string = ''
  private uv: [number, number] = [0, 0]
  private uvSize: [number, number] = [0, 0]
  private bilinear: boolean = false
  private nineslice: [number, number, number, number] = [0, 0, 0, 0]
  
  constructor(parent: UIEl | undefined, name: string, data: { [key: string]: any }) {
    super(parent, name, data)
    this.setProp(data['texture'], (v) => { this.texture = v })
    this.setProp(data['uv'], (v) => { this.uv = v })
    this.setProp(data['uv_size'], (v) => { this.uvSize = v })
    this.setProp(data['bilinear'], (v) => { this.bilinear = v })
    this.setProp(data['nineslice'], (v) => {
      let a = v as number | [number, number] | [number, number, number, number]
      if(typeof a === 'number') {
        a = [a, a, a, a]
      } else {
        if(a.length === 2) {
          a = [a[0], a[1], a[0], a[1]]
        }
      }
      
      this.nineslice = a
    })
  }

  render(parent: HTMLElement) {
    let el = document.createElement('div')
    el.style.position = 'absolute'

    el.style.overflow = 'hidden'
    
    let img = document.createElement('img')

    if(this.size[0] !== 0 && this.size[1] !== 0) {
      el.style.width = typeof this.size[0] === 'number' ? this.size[0] + 'px' : 'calc(' + this.size[0] + ')' 
      el.style.height = typeof this.size[1] === 'number' ? this.size[1] + 'px' : 'calc(' + this.size[1] + ')' 
    }

    if(this.texture !== '') {
      img.src = this.texture
      if(!this.bilinear) {
        img.style.imageRendering = 'pixelated'
        img.style.imageRendering = 'crisp-edges'
      }
      el.appendChild(img)

      img.onload = () => {
        if(this.uvSize[0] !== 0 && this.uvSize[1] !== 0) {
          let c = document.createElement('canvas')
          c.width = this.uvSize[0]
          c.height = this.uvSize[1]
          let ctx = c.getContext('2d') as CanvasRenderingContext2D
          ctx.imageSmoothingEnabled = this.bilinear
          ctx.drawImage(img, this.uv[0], this.uv[1], this.uvSize[0], this.uvSize[1], 0, 0, this.uvSize[0], this.uvSize[1])

          img.src = c.toDataURL("image/png");

          img.onload = () => {
            img.style.width = '100%'
            img.style.height = '100%'
          }
        } else if(!(this.nineslice[0] === 0 || this.nineslice[1] === 0 || this.nineslice[2] === 0 || this.nineslice[3] === 0)) {
          let c = document.createElement('canvas')
          c.width = el.getBoundingClientRect().width
          c.height = el.getBoundingClientRect().height
          let ctx = c.getContext('2d') as CanvasRenderingContext2D
          ctx.imageSmoothingEnabled = this.bilinear
        
          ctx.drawImage(img, 0, 0, 1, img.height / 2, 0, 0, 3, (img.height / 2) * 3)
          ctx.drawImage(img, 0, 1, 1, 1, 0, 3, 3, c.height - 2 * 3)
          ctx.drawImage(img, 0, img.height / 2, 1, img.height / 2, 0, c.height - (img.height / 2) * 3, 3, (img.height / 2) * 3)

          ctx.drawImage(img, 0, 0, img.width / 2, 1, 0, 0, img.width / 2 * 3, 3)
          ctx.drawImage(img, 1, 0, 1, 1, 2 * 3, 0, c.width - 3 * 3, 3)
          
          ctx.drawImage(img, 1, 1, img.width - 2, img.height - 2, 3, 3, c.width - 2 * 3, c.height - 2 * 3)
          
          ctx.drawImage(img, 0, img.height - 1, img.width / 2, 1, 0, c.height - 1 * 3, img.width / 2 * 3, 3)
          ctx.drawImage(img, 1, img.height - 1, 1, 1, 2 * 3, c.height - 1 * 3, c.width - 3 * 3, 3)
          
          // ctx.drawImage(img, 0, img.height / 2, 1, img.height / 2, 0, el.clientHeight, 3, (img.height / 2) * 3)

          img.src = c.toDataURL("image/png");

          img.onload = () => {
            img.style.width = '100%'
            img.style.height = '100%'
          }
        }
        img.style.width = '100%'
        img.style.height = '100%'
      }
    }


    switch(this.anchorFrom) {
      case 'top_left':
        el.style.top = this.offset[1] + 'px'
        el.style.left = this.offset[0] + 'px'
        break;
      case 'top_middle':
        el.style.left = 'calc(50% + ' + this.offset[0] + 'px)'
        el.style.top = this.offset[1] + 'px'
        el.style.transform = 'translate(-50%)'
        break;
      case 'top_right':
        el.style.right = -this.offset[0] + 'px'
        el.style.top = this.offset[1] + 'px'
        break;
      case 'left_middle':
        el.style.top = 'calc(50% + ' + this.offset[1] + 'px)'
        el.style.left = this.offset[0] + 'px'
        el.style.transform = 'translate(0, -50%)'
        break;
      case 'center':
        el.style.left = 'calc(50% + ' + this.offset[0] + 'px)'
        el.style.top = 'calc(50% + ' + this.offset[1] + 'px)'
        el.style.transform = 'translate(-50%, -50%)'
        break;
      case 'right_middle':
        el.style.top = 'calc(50% + ' + this.offset[1] + 'px)'
        el.style.right = -this.offset[0] + 'px'
        el.style.transform = 'translate(0, -50%)'
        break;
      case 'bottom_left':
        el.style.top = 'calc(100% + ' + this.offset[1] + 'px)'
        el.style.left = this.offset[0] + 'px'
        el.style.transform = 'translate(0, -100%)'
        break;
      case 'bottom_middle':
        el.style.top = 'calc(100% + ' + this.offset[1] + 'px)'
        el.style.left = 'calc(50% + ' + this.offset[0] + 'px)'
        el.style.transform = 'translate(-50%, -100%)'
        break;
      case 'bottom_right':
        el.style.top = 'calc(100% + ' + this.offset[1] + 'px)'
        el.style.right = -this.offset[0] + 'px'
        el.style.transform = 'translate(0, -100%)'
        break;
  
      default:
        el.style.top = this.offset[1] + 'px'
        el.style.left = this.offset[0] + 'px'
        break;
    }

    if(this.layer !== 1.0) {
      el.style.zIndex = `${this.layer}`
    }

    if(!this.allowClipping) el.style.overflow = 'hidden'
    if(!this.visible) el.style.display = 'none'
    if(!this.ignored) parent.appendChild(el)
    this.children.map(child => child.render(el))
  }
}

class UIElButton extends UIEl {
  private buttonMappings: { from_button_id: string, to_button_id: string, mapping_type: 'pressed' | 'double_pressed', ignored?: boolean }[] = []
  private defaultState: string = ''
  private hoverState: string = ''
  private pressedState: string = ''
  private lockedState: string = ''
  private enabled: boolean = true

  constructor(parent: UIEl | undefined,name: string, data: { [key: string]: any }) {
    super(parent, name, data)
    this.setProp(data['button_mappings'], (v) => { this.buttonMappings = v })
    this.setProp(data['enabled'], (v) => { this.enabled = v })
    this.setProp(data['default_state'], (v) => { this.defaultState = v })
    this.setProp(data['hover_state'], (v) => { this.hoverState = v })
    this.setProp(data['pressed_state'], (v) => { this.pressedState = v })
    this.setProp(data['locked_state'], (v) => { this.lockedState = v })
  }

  render(parent: HTMLElement) {
    let el = document.createElement('div')
    el.style.position = 'absolute'
    el.style.pointerEvents = 'all'

    if(this.size[0] !== 0 && this.size[1] !== 0) {
      el.style.width = typeof this.size[0] === 'number' ? this.size[0] + 'px' : 'calc(' + this.size[0] + ')' 
      el.style.height = typeof this.size[1] === 'number' ? this.size[1] + 'px' : 'calc(' + this.size[1] + ')' 
    }

    switch(this.anchorFrom) {
      case 'top_left':
        el.style.top = this.offset[1] + 'px'
        el.style.left = this.offset[0] + 'px'
        break;
      case 'top_middle':
        el.style.left = 'calc(50% + ' + this.offset[0] + 'px)'
        el.style.top = this.offset[1] + 'px'
        el.style.transform = 'translate(-50%)'
        break;
      case 'top_right':
        el.style.right = -this.offset[0] + 'px'
        el.style.top = this.offset[1] + 'px'
        break;
      case 'left_middle':
        el.style.top = 'calc(50% + ' + this.offset[1] + 'px)'
        el.style.left = this.offset[0] + 'px'
        el.style.transform = 'translate(0, -50%)'
        break;
      case 'center':
        el.style.left = 'calc(50% + ' + this.offset[0] + 'px)'
        el.style.top = 'calc(50% + ' + this.offset[1] + 'px)'
        el.style.transform = 'translate(-50%, -50%)'
        break;
      case 'right_middle':
        el.style.top = 'calc(50% + ' + this.offset[1] + 'px)'
        el.style.right = -this.offset[0] + 'px'
        el.style.transform = 'translate(0, -50%)'
        break;
      case 'bottom_left':
        el.style.top = 'calc(100% + ' + this.offset[1] + 'px)'
        el.style.left = this.offset[0] + 'px'
        el.style.transform = 'translate(0, -100%)'
        break;
      case 'bottom_middle':
        el.style.top = 'calc(100% + ' + this.offset[1] + 'px)'
        el.style.left = 'calc(50% + ' + this.offset[0] + 'px)'
        el.style.transform = 'translate(-50%, -100%)'
        break;
      case 'bottom_right':
        el.style.top = 'calc(100% + ' + this.offset[1] + 'px)'
        el.style.right = -this.offset[0] + 'px'
        el.style.transform = 'translate(0, -100%)'
        break;
  
      default:
        el.style.top = this.offset[1] + 'px'
        el.style.left = this.offset[0] + 'px'
        break;
    }

    this.buttonMappings.forEach(value => {
      if(value.ignored === undefined || value.ignored === false) {
        if(value.from_button_id === 'button.button_0') {
          el.addEventListener(value.mapping_type === 'pressed' ? 'click' : value.mapping_type === 'double_pressed' ? 'dblclick' : 'click', () => {
            if(value.to_button_id === 'button.console_log_test0') {
              console.log('button was clicked')
            } else {
              console.log('button was double clicked')
            }
  
            if(value.to_button_id === 'button.menu_other') {
              (screens.get('ui/play_screen.json') as UIScreen).render(root)
            }
  
            if(value.to_button_id === 'button.menu_exit') {
              // Screens.testScreen.render(root)
              (screens.get('ui/start_screen.json') as UIScreen).render(root)
  
            }
          })
        }
      }
    })
    
    if(!this.allowClipping) {
      el.style.overflow = 'hidden'
    }
    if(!this.enabled) el.setAttribute('disabled', 'true')
    if(!this.enabled) el.style.pointerEvents = 'none'
    if(!this.visible) el.style.display = 'none'
    if(!this.ignored) parent.appendChild(el)

    el.innerHTML = ''
    this.children.map(child => {
      if(el.getAttribute('disabled') === 'true') {
        if(this.lockedState !== '') {
          if(child.getName() !== this.hoverState && child.getName() !== this.defaultState && child.getName() !== this.pressedState) child.render(el)
        } else {
          if(child.getName() !== this.hoverState && child.getName() !== this.lockedState && child.getName() !== this.pressedState) child.render(el)
        }
      }
      else if(child.getName() !== this.hoverState && child.getName() !== this.pressedState  && child.getName() !== this.lockedState) {
        child.render(el)
      }
    })

    el.addEventListener('mouseenter', () => {
      el.innerHTML = ''
      this.children.map(child => {
        if(el.getAttribute('disabled') === 'true') {
          if(this.lockedState !== '') {
            if(child.getName() !== this.hoverState && child.getName() !== this.defaultState && child.getName() !== this.pressedState) child.render(el)
          } else {
            if(child.getName() !== this.hoverState && child.getName() !== this.lockedState && child.getName() !== this.pressedState) child.render(el)
          }
        }
        else if(child.getName() !== this.defaultState && child.getName() !== this.pressedState && child.getName() !== this.lockedState) child.render(el)
      })
    })

    el.addEventListener('mouseleave', () => {
      el.innerHTML = ''
      this.children.map(child => { 
        if(el.getAttribute('disabled') === 'true') {
          if(this.lockedState !== '') {
            if(child.getName() !== this.hoverState && child.getName() !== this.defaultState && child.getName() !== this.pressedState) child.render(el)
          } else {
            if(child.getName() !== this.hoverState && child.getName() !== this.lockedState && child.getName() !== this.pressedState) child.render(el)
          }
        }
        else if(child.getName() !== this.hoverState && child.getName() !== this.pressedState && child.getName() !== this.lockedState) child.render(el)
      })
    })

    el.addEventListener('mousedown', () => {
      el.innerHTML = ''
      this.children.map(child => {
        if(el.getAttribute('disabled') === 'true') {
          if(this.lockedState !== '') {
            if(child.getName() !== this.hoverState && child.getName() !== this.defaultState && child.getName() !== this.pressedState) child.render(el)
          } else {
            if(child.getName() !== this.hoverState && child.getName() !== this.lockedState && child.getName() !== this.pressedState) child.render(el)
          }
        }
        else if(child.getName() !== this.hoverState && child.getName() !== this.defaultState && child.getName() !== this.lockedState) child.render(el)
      })
    })
  }
}

class UIElCustom extends UIEl {
  private renderer: string = ''
  private color: string | [number, number, number] = 'white'

  constructor(parent: UIEl | undefined,name: string, data: { [key: string]: any }) {
    super(parent, name, data)
    this.setProp(data['renderer'], (v) => { this.renderer = v })
    this.setProp(data['color'], (v) => { this.color = v })
  }

  render(parent: HTMLElement) {
    let el = document.createElement('div')
    el.style.position = 'absolute'

    if(this.renderer === 'fill') {
      el.style.width = '100%'
      el.style.height = '100%'

      el.style.background = typeof this.color === 'string' ? this.color : `rgb(${this.color[0] * 255}, ${this.color[1] * 255}, ${this.color[2] * 255})`
    }

    if(this.renderer === 'splash_text_renderer') {
      el.innerText = splashes[Math.round(Math.random() * splashes.length) - 1]
    }

    if(!this.allowClipping) el.style.overflow = 'hidden'
    if(!this.visible) el.style.display = 'none'
    if(!this.ignored) parent.appendChild(el)
    this.children.map(child => child.render(el))
  }
}

class UIScreen {
  namespace: string = ''
  children: UIEl[] = []
  
  constructor(data: any) {
    let o = Object.entries(data)

    o.map((v) => {
      if(v[0] !== 'namespace') {
        let a: any = v[1]
        if(a['type'] === 'panel') this.children.push(new UIElPanel(undefined, v[0], a))
        if(a['type'] === 'button') this.children.push(new UIElButton(undefined, v[0], a))
        if(a['type'] === 'image') this.children.push(new UIElImage(undefined, v[0], a))
        if(a['type'] === 'label') this.children.push(new UIElLabel(undefined, v[0], a))
        if(a['type'] === 'custom') this.children.push(new UIElCustom(undefined, v[0], a))
        if(a['type'] === 'stack_panel') this.children.push(new UIElStackPanel(undefined, v[0], a))
      } else {
        this.namespace = v[0]
      }
    })    
  }

  render(parent: HTMLElement) {
    parent.innerHTML = ''
    this.children.map(child => child.render(parent))
  }
}

class TestUIScreen extends UIScreen {
  constructor(data: any) {
    super(data)
  }
}

class OtherUIScreen extends UIScreen {
  constructor(data: any) {
    super(data)
  }
}

async function readJsonFile(url: string) {
  // let data = (await fs.readFile(url))
  let data = await (await fetch(url)).text()
  let file = (data).toString().replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/|\#.*)/g, (m, g) => g ? "" : m)
  // @ts-ignore
  return JSON.parse(file)
}

;(async () => {
  const profanityFilter = await (await fetch('./profanity_filter.wlist')).text()
  profanityList = profanityFilter.split('\r\n')

  const uiDefs = await readJsonFile('./ui/_ui_defs.json')
  console.log(uiDefs);
  const globalVariables = await readJsonFile('./ui/_globaL_variables.json')
  Object.entries(globalVariables).map(v => {
    globalVars.set(v[0], v[1])
  })

  const splashTexts = await readJsonFile('./splashes.json')
  splashes = splashTexts['splashes']
  console.log(splashes);

  const languagesList: string[] = await readJsonFile('./texts/languages.json')
  console.log(languagesList)

  let promises: Promise<any>[] = []
  
  languagesList.map((lang) => {
    promises.push(new Promise(async(resolve, reject) => {
      let file = await (await fetch('./texts/' + lang + '.lang')).text()

      let a = file.split('\r\n').filter(v => !v.startsWith('##'))
      a = a.filter(v => v.length !== 0)
      let obj: any = {}
      a.map(v => {
        obj[v.substring(0, v.indexOf('='))] = v.substring(v.indexOf('=') + 1, v.length)
      })
  
      langsList.set(lang, obj)
      resolve(undefined)
    }))
  })

  await Promise.all(promises)

  console.log(langsList)
  
  ;(uiDefs['ui_defs'] as string[]).map(async (v) => {
    const file = await readJsonFile('./' + v)
    screens.set(v, new UIScreen(file))

    if(v.includes('start_screen.json')) {
      (screens.get(v) as UIScreen).render(root)
    }
  })
})()